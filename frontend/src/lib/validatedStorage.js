// frontend/src/lib/validatedStorage.js

/**
 * ValidatedStorage - A localStorage wrapper that validates Supabase auth tokens
 * before they reach the SDK, preventing blank page issues from corrupted sessions.
 */
class ValidatedStorage {
  constructor() {
    this.isDevMode = import.meta.env.DEV;
    this.initializeDevMode();
  }

  /**
   * Development mode initialization
   */
  initializeDevMode() {
    if (!this.isDevMode) return;

    // Clear potentially corrupted tokens on dev server restart
    const devSessionKey = 'validatedStorage.devSession';
    const currentSession = Date.now().toString();
    const lastSession = localStorage.getItem(devSessionKey);

    if (!lastSession || lastSession !== currentSession) {
      // New dev session detected - clean up auth tokens
      this.cleanupAuthTokens();
      localStorage.setItem(devSessionKey, currentSession);
      console.log('ValidatedStorage: Dev mode - cleaned auth tokens for fresh session');
    }
  }

  /**
   * Clean up all Supabase auth tokens (development helper)
   */
  cleanupAuthTokens() {
    try {
      const keysToRemove = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (this.isSupabaseAuthKey(key)) {
          keysToRemove.push(key);
        }
      }

      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
      });

      if (keysToRemove.length > 0 && this.isDevMode) {
        console.log(`ValidatedStorage: Cleaned ${keysToRemove.length} auth tokens`);
      }
    } catch (error) {
      console.warn('ValidatedStorage: Error cleaning auth tokens:', error);
    }
  }

  /**
   * Bulletproof logout - purges ALL auth artifacts from both storages
   * Used for logout scenarios where we need to ensure no rehydration
   */
  purgeAllAuthArtifacts() {
    try {
      const removedKeys = [];

      // Clean localStorage - all sb-* keys and auth variations
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key && (
          key.startsWith('sb-') ||
          key.includes('supabase') ||
          key.includes('auth-token') ||
          key === 'tg_oauth_state_last'
        )) {
          localStorage.removeItem(key);
          removedKeys.push(key);
        }
      }

      // Clean sessionStorage - all auth-related keys
      try {
        sessionStorage.removeItem('tg_oauth_state');
        for (let i = sessionStorage.length - 1; i >= 0; i--) {
          const key = sessionStorage.key(i);
          if (key && (
            key.startsWith('sb-') ||
            key.includes('supabase') ||
            key.includes('auth')
          )) {
            sessionStorage.removeItem(key);
            removedKeys.push(`session:${key}`);
          }
        }
      } catch (e) {
        // sessionStorage might not be available in some contexts
      }

      console.log(`ValidatedStorage: Purged ${removedKeys.length} auth artifacts for clean logout`);
      return removedKeys.length;
    } catch (error) {
      console.warn('ValidatedStorage: Error purging auth artifacts:', error);
      return 0;
    }
  }

  /**
   * Validates if the auth session data is structurally correct
   * CRITICAL: Only validates essential structure, lets Supabase handle expiration/refresh
   */
  isValidAuthSession(sessionData) {
    try {
      // The only checks we need are for the absolute minimum required fields.
      // We DO NOT check for email or expiration time.
      if (!sessionData?.access_token || !sessionData?.user?.id) {
        return false;
      }
      return true;
    } catch {
      // If parsing or access fails for any reason, treat as invalid.
      return false;
    }
  }

  /**
   * Checks if a localStorage key is a Supabase auth token
   */
  isSupabaseAuthKey(key) {
    return key && (
      key.includes('supabase.auth.token') ||
      key.includes('sb-') && key.includes('auth-token') ||
      key.includes('supabase-auth-token')
    );
  }

  /**
   * Validates and cleans auth data
   */
  validateAndCleanAuthData(value) {
    if (!value) return null;

    try {
      const parsed = JSON.parse(value);
      
      // If it's a valid session, return original value
      if (this.isValidAuthSession(parsed)) {
        return value;
      }

      // If invalid, log and return null (which means "no session" to Supabase)
      if (this.isDevMode) {
        console.log('ValidatedStorage: Removing structurally invalid auth session (missing access_token or user.id)');
      }

      // Clean up the corrupted token from localStorage
      return null;

    } catch (error) {
      // Corrupted JSON - return null
      if (this.isDevMode) {
        console.log('ValidatedStorage: Removing corrupted auth JSON:', error.message);
      }
      return null;
    }
  }

  /**
   * localStorage wrapper methods
   */
  getItem(key) {
    try {
      const value = localStorage.getItem(key);
      
      // Only validate Supabase auth keys
      if (this.isSupabaseAuthKey(key)) {
        const validatedValue = this.validateAndCleanAuthData(value);
        
        // If we cleaned a corrupted token, remove it from localStorage
        if (value && !validatedValue) {
          localStorage.removeItem(key);
          if (this.isDevMode) {
            console.log('ValidatedStorage: Cleaned corrupted token from localStorage');
          }
        }
        
        return validatedValue;
      }

      // Return other keys unchanged
      return value;
    } catch (error) {
      console.error('ValidatedStorage: Error in getItem:', error);
      return null;
    }
  }

  setItem(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.error('ValidatedStorage: Error in setItem:', error);
    }
  }

  removeItem(key) {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('ValidatedStorage: Error in removeItem:', error);
    }
  }

  clear() {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('ValidatedStorage: Error in clear:', error);
    }
  }

  key(index) {
    try {
      return localStorage.key(index);
    } catch (error) {
      console.error('ValidatedStorage: Error in key:', error);
      return null;
    }
  }

  get length() {
    try {
      return localStorage.length;
    } catch (error) {
      console.error('ValidatedStorage: Error getting length:', error);
      return 0;
    }
  }
}

// Export singleton instance
export const validatedStorage = new ValidatedStorage();

// Log validation fix deployment for debugging
if (import.meta.env.DEV) {
  console.log('🔧 ValidatedStorage: Using simplified validation (no email/expiration checks)');
}

// Utility functions for manual testing and recovery
export const clearCorruptedAuthTokens = () => {
  validatedStorage.cleanupAuthTokens();
  console.log('✅ Auth tokens cleared. Please refresh the page.');
};

export const testLogoutCleanup = () => {
  const purgedCount = validatedStorage.purgeAllAuthArtifacts();
  console.log(`✅ Logout test: Purged ${purgedCount} auth artifacts.`);
  return purgedCount;
};

export const inspectAuthState = async () => {
  const sbKeys = Object.keys(localStorage).filter(k => k.startsWith('sb-'));
  const sessionKeys = Object.keys(sessionStorage).filter(k => k.startsWith('sb-') || k.includes('auth'));
  
  console.log('🔍 Auth state inspection:');
  console.log('- localStorage sb-* keys:', sbKeys.length, sbKeys);
  console.log('- sessionStorage auth keys:', sessionKeys.length, sessionKeys);
  
  return { localStorage: sbKeys, sessionStorage: sessionKeys };
};

// Make utilities available globally for debugging
if (typeof window !== 'undefined') {
  window.clearCorruptedAuthTokens = clearCorruptedAuthTokens;
  window.testLogoutCleanup = testLogoutCleanup;
  window.inspectAuthState = inspectAuthState;
  
  if (import.meta.env.DEV) {
    console.log('🛠️ Auth debugging utilities available: clearCorruptedAuthTokens(), testLogoutCleanup(), inspectAuthState()');
  }
}