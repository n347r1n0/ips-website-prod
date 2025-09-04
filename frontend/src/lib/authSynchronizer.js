// frontend/src/lib/authSynchronizer.js
// Auth state synchronization to prevent race conditions and session conflicts

import { supabase } from '@/lib/supabaseClient';

class AuthSynchronizer {
  constructor() {
    // Track ongoing auth operations
    this.pendingAuths = new Map(); // authId -> { promise, cancel, timestamp }
    this.sessionSequence = 0; // Increment for each session change
    this.deviceFingerprint = this.generateDeviceFingerprint();
    this.lastSessionState = null;
    this.authStateChangeHandlers = new Set();
    
    // Cleanup old auth attempts periodically
    setInterval(() => this.cleanupStaleAuths(), 30000); // Every 30s
  }

  generateDeviceFingerprint() {
    // Create a semi-unique device fingerprint to distinguish auth sources
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillText('Device fingerprint', 2, 2);
    
    const fingerprint = [
      navigator.userAgent,
      navigator.language,
      screen.width + 'x' + screen.height,
      new Date().getTimezoneOffset(),
      canvas.toDataURL(),
      Date.now() % 1000000 // Add timestamp component for uniqueness
    ].join('|');
    
    // Create a simple hash
    let hash = 0;
    for (let i = 0; i < fingerprint.length; i++) {
      const char = fingerprint.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    const result = 'dev_' + Math.abs(hash).toString(36);
    console.log('🔑 [AUTH-SYNC] Device fingerprint generated:', result);
    return result;
  }

  generateAuthId(type = 'auth', userId = 'unknown') {
    this.sessionSequence++;
    return `${type}_${userId}_${this.deviceFingerprint}_${this.sessionSequence}_${Date.now()}`;
  }

  cleanupStaleAuths() {
    const now = Date.now();
    const STALE_TIMEOUT = 60000; // 60 seconds

    for (const [authId, authInfo] of this.pendingAuths) {
      if (now - authInfo.timestamp > STALE_TIMEOUT) {
        console.log('🧹 [AUTH-SYNC] Cleaning up stale auth:', authId);
        try {
          authInfo.cancel();
        } catch {
          // Ignore cancel errors
        }
        this.pendingAuths.delete(authId);
      }
    }
  }

  async cancelConflictingAuths(currentAuthId, userId) {
    console.log(`🚫 [AUTH-SYNC] Canceling conflicting auths for user: ${userId}, keeping: ${currentAuthId}`);
    
    for (const [authId, authInfo] of this.pendingAuths) {
      if (authId !== currentAuthId && authId.includes(userId)) {
        console.log(`🚫 [AUTH-SYNC] Canceling conflicting auth: ${authId}`);
        try {
          authInfo.cancel();
        } catch {
          // Ignore cancel errors
        }
        this.pendingAuths.delete(authId);
      }
    }
  }

  async synchronizedAuth(authFunction, options = {}) {
    const { 
      type = 'telegram',
      userId = 'unknown',
      timeout = 30000
    } = options;

    const authId = this.generateAuthId(type, userId);
    console.log(`🔄 [AUTH-SYNC] Starting synchronized auth: ${authId}`);

    // Cancel any conflicting ongoing auths for this user
    await this.cancelConflictingAuths(authId, userId);

    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      let cancelled = false;

      // Create cancellation mechanism
      const cancel = () => {
        cancelled = true;
        console.log(`🚫 [AUTH-SYNC] Auth cancelled: ${authId}`);
        reject(new Error('Auth operation was cancelled due to newer auth attempt'));
      };

      // Timeout mechanism
      const timeoutId = setTimeout(() => {
        if (!cancelled) {
          cancel();
          reject(new Error(`Auth operation timed out after ${timeout}ms`));
        }
      }, timeout);

      // Track this auth attempt
      this.pendingAuths.set(authId, {
        promise: { resolve, reject },
        cancel,
        timestamp: startTime,
        userId,
        type
      });

      // Execute the auth function
      authFunction()
        .then((result) => {
          if (cancelled) {
            console.log(`🚫 [AUTH-SYNC] Auth result ignored (cancelled): ${authId}`);
            return;
          }

          clearTimeout(timeoutId);
          this.pendingAuths.delete(authId);
          
          const duration = Date.now() - startTime;
          console.log(`✅ [AUTH-SYNC] Auth completed successfully in ${duration}ms: ${authId}`);
          
          resolve(result);
        })
        .catch((error) => {
          if (cancelled) {
            console.log(`🚫 [AUTH-SYNC] Auth error ignored (cancelled): ${authId}`);
            return;
          }

          clearTimeout(timeoutId);
          this.pendingAuths.delete(authId);
          
          const duration = Date.now() - startTime;
          console.error(`❌ [AUTH-SYNC] Auth failed after ${duration}ms: ${authId}`, error);
          
          reject(error);
        });
    });
  }

  async synchronizedSessionSet(tokens, options = {}) {
    const { 
      maxWaitTime = 15000,
      verificationDelay = 200,
      userId = 'unknown'
    } = options;

    const authId = this.generateAuthId('session', userId);
    console.log(`🔄 [AUTH-SYNC] Starting synchronized session set: ${authId}`);

    // Cancel any ongoing session operations
    await this.cancelConflictingAuths(authId, userId);

    return this.synchronizedAuth(async () => {
      console.log(`🔑 [AUTH-SYNC] Setting session tokens for: ${authId}`);
      
      // Set the session
      const { error: setError } = await supabase.auth.setSession({
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
      });

      if (setError) {
        console.error(`❌ [AUTH-SYNC] Failed to set session for ${authId}:`, setError);
        throw new Error(`Failed to set session: ${setError.message}`);
      }

      console.log(`✅ [AUTH-SYNC] Session tokens set for ${authId}, verifying...`);

      // Verify session with controlled polling
      let attempts = 0;
      const maxAttempts = Math.ceil(maxWaitTime / verificationDelay);
      
      while (attempts < maxAttempts) {
        try {
          const { data: { session }, error } = await supabase.auth.getSession();
          
          if (error) {
            console.warn(`⚠️ [AUTH-SYNC] Session verification error for ${authId}:`, error);
            throw new Error(`Session verification error: ${error.message}`);
          }

          if (session && session.access_token && session.user?.id) {
            console.log(`✅ [AUTH-SYNC] Session verified successfully for ${authId}`);
            this.lastSessionState = {
              userId: session.user.id,
              sessionId: authId,
              timestamp: Date.now(),
              sequence: this.sessionSequence
            };
            return { success: true, session, error: null };
          }

          attempts++;
          console.log(`🔄 [AUTH-SYNC] Session not ready for ${authId}, attempt ${attempts}/${maxAttempts}`);
          
          if (attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, verificationDelay));
          }
        } catch (error) {
          console.error(`❌ [AUTH-SYNC] Session verification failed for ${authId}:`, error);
          throw error;
        }
      }

      throw new Error(`Session verification timeout after ${maxWaitTime}ms for ${authId}`);
    }, {
      type: 'session',
      userId,
      timeout: maxWaitTime + 5000 // Give extra time beyond verification timeout
    });
  }

  isAuthInProgress(userId = null) {
    if (!userId) {
      return this.pendingAuths.size > 0;
    }
    
    for (const [authId] of this.pendingAuths) {
      if (authId.includes(userId)) {
        return true;
      }
    }
    return false;
  }

  getPendingAuthCount() {
    return this.pendingAuths.size;
  }

  async cancelAllPendingAuths() {
    console.log(`🚫 [AUTH-SYNC] Canceling all ${this.pendingAuths.size} pending auths`);
    
    for (const [, authInfo] of this.pendingAuths) {
      try {
        authInfo.cancel();
      } catch {
        // Ignore cancel errors
      }
    }
    
    this.pendingAuths.clear();
  }

  // Register auth state change handlers with deduplication
  onAuthStateChange(handler) {
    this.authStateChangeHandlers.add(handler);
    
    return () => {
      this.authStateChangeHandlers.delete(handler);
    };
  }

  // Controlled auth state change emission to prevent races
  async emitAuthStateChange(event, session) {
    const stateChangeId = `state_${event}_${Date.now()}`;
    console.log(`📢 [AUTH-SYNC] Emitting auth state change: ${stateChangeId}`, {
      event,
      userId: session?.user?.id || 'none',
      pendingAuths: this.pendingAuths.size
    });

    // If we have pending auths, delay state change to avoid races
    if (this.pendingAuths.size > 0) {
      console.log(`⏳ [AUTH-SYNC] Delaying state change due to ${this.pendingAuths.size} pending auths`);
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Emit to all registered handlers
    for (const handler of this.authStateChangeHandlers) {
      try {
        await handler(event, session);
      } catch (error) {
        console.error(`❌ [AUTH-SYNC] Auth state change handler error:`, error);
      }
    }
  }
}

// Create singleton instance
export const authSynchronizer = new AuthSynchronizer();

// Enhanced session utilities with synchronization
export async function synchronizedSetSession(tokens, options = {}) {
  return authSynchronizer.synchronizedSessionSet(tokens, options);
}

export async function synchronizedTelegramAuth(telegramAuthData, authFunction, options = {}) {
  const userId = telegramAuthData?.id || 'unknown';
  
  return authSynchronizer.synchronizedAuth(authFunction, {
    type: 'telegram',
    userId: `tg_${userId}`,
    timeout: options.timeout || 30000,
    ...options
  });
}

export function isAuthInProgress(userId = null) {
  return authSynchronizer.isAuthInProgress(userId);
}

export function cancelAllPendingAuths() {
  return authSynchronizer.cancelAllPendingAuths();
}