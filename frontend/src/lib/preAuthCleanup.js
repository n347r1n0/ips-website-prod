// frontend/src/lib/preAuthCleanup.js

import { supabase } from '@/lib/supabaseClient';
import { validatedStorage } from '@/lib/validatedStorage';
import { iosSafariUtils } from '@/lib/iosSafariUtils';

/**
 * Comprehensive pre-authentication cleanup to eliminate auth flakiness
 * Runs before any user-initiated auth flow (Telegram OAuth, email login, etc.)
 * 
 * This function is:
 * - Idempotent (safe to call multiple times)
 * - Non-blocking (errors are swallowed)
 * - Fast (doesn't wait for slow operations)
 */
export async function preAuthCleanup(options = {}) {
  const { preserveGuestData = true, preserveRedirectUrl = false } = options;
  
  console.log('🧹 [PRE-AUTH-CLEANUP] Starting comprehensive cleanup...');
  
  // Store guest data if we need to preserve it
  let savedGuestData = null;
  let savedRedirectUrl = null;
  
  if (preserveGuestData) {
    try {
      savedGuestData = localStorage.getItem('guestStore');
    } catch (e) {
      // Ignore storage errors
    }
  }
  
  if (preserveRedirectUrl) {
    try {
      savedRedirectUrl = sessionStorage.getItem('redirect-after-auth');
    } catch (e) {
      // Ignore storage errors
    }
  }

  // 1. SUPABASE SESSION CLEANUP
  try {
    console.log('🔄 [PRE-AUTH-CLEANUP] Signing out from Supabase...');
    await supabase.auth.signOut();
    
    // Verify session is cleared
    const { data: session } = await supabase.auth.getSession();
    if (session?.session) {
      console.warn('⚠️ [PRE-AUTH-CLEANUP] Session still exists after signOut, forcing refresh');
      await supabase.auth.refreshSession();
      await supabase.auth.signOut();
    }
  } catch (error) {
    console.warn('⚠️ [PRE-AUTH-CLEANUP] Supabase cleanup failed:', error.message);
  }

  // 2. LOCAL/SESSION STORAGE CLEANUP
  try {
    console.log('🗑️ [PRE-AUTH-CLEANUP] Clearing auth artifacts from storage...');
    
    const authKeys = [
      // OAuth state management
      'tg_auth_state',
      'tg_auth_nonce', 
      'oauth_state',
      'oauth-redirect-pending',
      'lastProvider',
      
      // Session tickets (legacy)
      'session_ticket',
      'enforce_session_ticket',
      'session-ticket-pending',
      
      // Supabase tokens (if manually stored)
      'sb-access-token',
      'sb-refresh-token',
      'sb-session',
      
      // Auth flow states
      'auth-flow-pending',
      'telegram-auth-pending',
      'registration-pending',
      
      // Redirect states
      'auth-redirect-url',
      'post-auth-action'
    ];

    // Clear from both localStorage and sessionStorage
    authKeys.forEach(key => {
      try {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
      } catch (e) {
        // Ignore individual key errors
      }
    });

    // Use existing purge function for additional cleanup
    const clearedCount = validatedStorage.purgeAllAuthArtifacts();
    console.log(`✅ [PRE-AUTH-CLEANUP] Cleared ${clearedCount} storage artifacts`);
    
  } catch (error) {
    console.warn('⚠️ [PRE-AUTH-CLEANUP] Storage cleanup failed:', error.message);
  }

  // 3. COOKIES CLEANUP (auth-related only)
  try {
    console.log('🍪 [PRE-AUTH-CLEANUP] Clearing auth cookies...');
    
    const authCookies = [
      'auth-session',
      'oauth-state', 
      'telegram-auth',
      'session-ticket'
    ];
    
    authCookies.forEach(cookieName => {
      try {
        // Clear for current domain and path
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
        // Clear for current domain with subdomain
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${window.location.hostname};`;
      } catch (e) {
        // Ignore cookie errors
      }
    });
    
  } catch (error) {
    console.warn('⚠️ [PRE-AUTH-CLEANUP] Cookie cleanup failed:', error.message);
  }

  // 4. INDEXEDDB + CACHE STORAGE (iOS WebView specific)
  if (typeof window !== 'undefined') {
    try {
      console.log('💾 [PRE-AUTH-CLEANUP] Attempting IndexedDB cleanup...');
      
      if ('indexedDB' in window) {
        // Get all databases and delete auth-related ones
        if (indexedDB.databases) {
          const databases = await indexedDB.databases();
          for (const db of databases) {
            if (db.name && (
              db.name.includes('supabase') || 
              db.name.includes('auth') ||
              db.name.includes('oauth')
            )) {
              try {
                indexedDB.deleteDatabase(db.name);
              } catch (e) {
                // Ignore individual DB errors
              }
            }
          }
        }
      }
      
      // Cache Storage cleanup
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        for (const cacheName of cacheNames) {
          if (cacheName.includes('auth') || cacheName.includes('supabase')) {
            try {
              await caches.delete(cacheName);
            } catch (e) {
              // Ignore individual cache errors
            }
          }
        }
      }
      
    } catch (error) {
      console.warn('⚠️ [PRE-AUTH-CLEANUP] IndexedDB/Cache cleanup failed:', error.message);
    }
  }

  // 5. iOS SAFARI SPECIFIC CLEANUP
  if (iosSafariUtils.isIOSSafari) {
    try {
      console.log('🍎 [PRE-AUTH-CLEANUP] iOS Safari specific cleanup...');
      iosSafariUtils.clearContextMarkers();
      iosSafariUtils.clearAuthArtifacts();
    } catch (error) {
      console.warn('⚠️ [PRE-AUTH-CLEANUP] iOS Safari cleanup failed:', error.message);
    }
  }

  // 6. URL CLEANUP - remove auth-related query params
  try {
    if (typeof window !== 'undefined' && window.location.search) {
      const url = new URL(window.location);
      const authParams = [
        'code', 
        'state', 
        'error',
        'access_token',
        'token_type',
        'expires_in',
        'refresh_token',
        'auth-callback',
        'telegram-auth'
      ];
      
      let cleaned = false;
      authParams.forEach(param => {
        if (url.searchParams.has(param)) {
          url.searchParams.delete(param);
          cleaned = true;
        }
      });
      
      if (cleaned) {
        console.log('🧹 [PRE-AUTH-CLEANUP] Cleaned auth params from URL');
        window.history.replaceState({}, '', url.toString());
      }
    }
  } catch (error) {
    console.warn('⚠️ [PRE-AUTH-CLEANUP] URL cleanup failed:', error.message);
  }

  // 7. RESTORE PRESERVED DATA
  if (savedGuestData && preserveGuestData) {
    try {
      localStorage.setItem('guestStore', savedGuestData);
      console.log('💾 [PRE-AUTH-CLEANUP] Restored guest data');
    } catch (e) {
      console.warn('⚠️ [PRE-AUTH-CLEANUP] Failed to restore guest data');
    }
  }
  
  if (savedRedirectUrl && preserveRedirectUrl) {
    try {
      sessionStorage.setItem('redirect-after-auth', savedRedirectUrl);
      console.log('💾 [PRE-AUTH-CLEANUP] Restored redirect URL');
    } catch (e) {
      console.warn('⚠️ [PRE-AUTH-CLEANUP] Failed to restore redirect URL');
    }
  }

  console.log('✅ [PRE-AUTH-CLEANUP] Comprehensive cleanup completed');
}

/**
 * Generate fresh OAuth state with TTL
 */
export function generateFreshOAuthState(ttlMinutes = 5) {
  try {
    const state = crypto.randomUUID();
    const nonce = crypto.randomUUID();
    const expires = Date.now() + (ttlMinutes * 60 * 1000);
    
    const stateData = {
      state,
      nonce, 
      expires,
      created: Date.now()
    };
    
    sessionStorage.setItem('oauth_state_data', JSON.stringify(stateData));
    
    console.log('🆕 [PRE-AUTH-CLEANUP] Generated fresh OAuth state with TTL');
    return { state, nonce };
  } catch (error) {
    console.error('❌ [PRE-AUTH-CLEANUP] Failed to generate OAuth state:', error);
    // Fallback to simple random strings
    return {
      state: Math.random().toString(36).substring(7),
      nonce: Math.random().toString(36).substring(7)
    };
  }
}

/**
 * Verify and consume OAuth state (call on auth callback)
 */
export function verifyAndConsumeOAuthState(receivedState) {
  try {
    const stateDataStr = sessionStorage.getItem('oauth_state_data');
    if (!stateDataStr) {
      console.warn('⚠️ [PRE-AUTH-CLEANUP] No stored OAuth state found');
      return false;
    }
    
    const stateData = JSON.parse(stateDataStr);
    
    // Check expiry
    if (Date.now() > stateData.expires) {
      console.warn('⚠️ [PRE-AUTH-CLEANUP] OAuth state expired');
      sessionStorage.removeItem('oauth_state_data');
      return false;
    }
    
    // Check state match
    if (stateData.state !== receivedState) {
      console.warn('⚠️ [PRE-AUTH-CLEANUP] OAuth state mismatch');
      sessionStorage.removeItem('oauth_state_data');
      return false;
    }
    
    // Valid - consume the state
    sessionStorage.removeItem('oauth_state_data');
    console.log('✅ [PRE-AUTH-CLEANUP] OAuth state verified and consumed');
    return true;
    
  } catch (error) {
    console.error('❌ [PRE-AUTH-CLEANUP] OAuth state verification failed:', error);
    // Clean up on error
    try {
      sessionStorage.removeItem('oauth_state_data');
    } catch (e) {
      // Ignore cleanup errors
    }
    return false;
  }
}