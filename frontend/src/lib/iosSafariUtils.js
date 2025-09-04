/**
 * iOS Safari specific utilities for handling background context issues
 */

export class IOSSafariUtils {
  constructor() {
    this.contextMarker = 'ios_context_marker';
    this.lastActiveTime = 'ios_last_active';
    this.isIOSSafari = this.detectIOSSafari();
  }

  /**
   * Detect iOS Safari browser
   */
  detectIOSSafari() {
    const ua = navigator.userAgent;
    const isIOS = /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
    const isSafari = /Safari/.test(ua) && !/Chrome|CriOS|FxiOS/.test(ua);
    return isIOS && isSafari;
  }

  /**
   * Check if context may have been contaminated after backgrounding
   */
  isContextSuspicious() {
    if (!this.isIOSSafari) return false;

    try {
      const marker = localStorage.getItem(this.contextMarker);
      const lastActive = localStorage.getItem(this.lastActiveTime);
      const now = Date.now();

      // If no marker exists, context is fresh
      if (!marker || !lastActive) return false;

      // If more than 5 minutes since last active, context is suspicious
      const timeSinceActive = now - parseInt(lastActive, 10);
      const SUSPICIOUS_THRESHOLD = 5 * 60 * 1000; // 5 minutes

      return timeSinceActive > SUSPICIOUS_THRESHOLD;
    } catch (e) {
      console.warn('IOSSafariUtils: Error checking context:', e);
      return false;
    }
  }

  /**
   * Mark current context as active
   */
  markContextActive() {
    if (!this.isIOSSafari) return;

    try {
      const now = Date.now().toString();
      localStorage.setItem(this.contextMarker, now);
      localStorage.setItem(this.lastActiveTime, now);
    } catch (e) {
      console.warn('IOSSafariUtils: Error marking context:', e);
    }
  }

  /**
   * Clear context markers (used during logout)
   */
  clearContextMarkers() {
    if (!this.isIOSSafari) return;

    try {
      localStorage.removeItem(this.contextMarker);
      localStorage.removeItem(this.lastActiveTime);
    } catch (e) {
      console.warn('IOSSafariUtils: Error clearing markers:', e);
    }
  }

  /**
   * Validate storage consistency for auth state
   */
  validateStorageConsistency() {
    if (!this.isIOSSafari) return { consistent: true, reason: 'not_ios_safari' };

    try {
      // Test if we can write and read back immediately
      const testKey = 'ios_storage_test';
      const testValue = Date.now().toString();
      
      localStorage.setItem(testKey, testValue);
      const readBack = localStorage.getItem(testKey);
      localStorage.removeItem(testKey);

      if (readBack !== testValue) {
        return { consistent: false, reason: 'storage_write_read_mismatch' };
      }

      // Check if sessionStorage is accessible
      sessionStorage.setItem(testKey, testValue);
      const sessionReadBack = sessionStorage.getItem(testKey);
      sessionStorage.removeItem(testKey);

      if (sessionReadBack !== testValue) {
        return { consistent: false, reason: 'session_storage_inaccessible' };
      }

      return { consistent: true, reason: 'validated' };
    } catch (e) {
      return { consistent: false, reason: 'storage_exception', error: e.message };
    }
  }

  /**
   * Force context refresh if needed
   */
  refreshContextIfNeeded() {
    if (!this.isIOSSafari) return false;

    const suspicious = this.isContextSuspicious();
    const consistency = this.validateStorageConsistency();

    if (suspicious || !consistency.consistent) {
      console.log('🔄 [iOS-Safari] Context refresh needed:', { suspicious, consistency });
      
      // Clear potentially contaminated auth artifacts
      this.clearAuthArtifacts();
      
      // Mark new context as active
      this.markContextActive();
      
      return true;
    }

    // Update active marker
    this.markContextActive();
    return false;
  }

  /**
   * iOS-specific auth artifacts cleanup
   */
  clearAuthArtifacts() {
    if (!this.isIOSSafari) return;

    const keysToRemove = [];

    // Clear all Supabase and auth-related keys
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && (
        key.startsWith('sb-') ||
        key.includes('supabase') ||
        key.includes('auth-token') ||
        key === 'tg_oauth_state_last' ||
        key.startsWith('tg_')
      )) {
        try {
          localStorage.removeItem(key);
          keysToRemove.push(key);
        } catch (e) {
          console.warn('IOSSafariUtils: Error removing key:', key, e);
        }
      }
    }

    // Clear sessionStorage
    try {
      for (let i = sessionStorage.length - 1; i >= 0; i--) {
        const key = sessionStorage.key(i);
        if (key && (
          key.startsWith('sb-') ||
          key.includes('supabase') ||
          key.includes('auth') ||
          key.startsWith('tg_')
        )) {
          sessionStorage.removeItem(key);
          keysToRemove.push(`session:${key}`);
        }
      }
    } catch (e) {
      console.warn('IOSSafariUtils: Error clearing sessionStorage:', e);
    }

    console.log(`🧹 [iOS-Safari] Cleared ${keysToRemove.length} potentially contaminated keys`);
    return keysToRemove.length;
  }

  /**
   * Add visibility change listeners for context tracking
   */
  addVisibilityTracking() {
    if (!this.isIOSSafari) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('🔄 [iOS-Safari] Page became visible');
        this.markContextActive();
      } else {
        console.log('🔄 [iOS-Safari] Page became hidden');
      }
    };

    const handleFocus = () => {
      console.log('🔄 [iOS-Safari] Window focused');
      this.markContextActive();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('pageshow', handleFocus);

    // Initial mark
    this.markContextActive();

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('pageshow', handleFocus);
    };
  }
}

// Export singleton instance
export const iosSafariUtils = new IOSSafariUtils();

// Utility functions for easy access
export const isIOSSafari = () => iosSafariUtils.isIOSSafari;
export const refreshIOSContextIfNeeded = () => iosSafariUtils.refreshContextIfNeeded();
export const validateIOSStorageConsistency = () => iosSafariUtils.validateStorageConsistency();
export const addIOSVisibilityTracking = () => iosSafariUtils.addVisibilityTracking();