/**
 * Session establishment utilities with retry logic for mobile reliability
 */

import { supabase } from './supabaseClient';
import { synchronizedSetSession, synchronizedTelegramAuth } from './authSynchronizer';

// waitForCondition function removed - now handled by synchronizer

/**
 * Retry a function call with exponential backoff
 */
async function retryWithBackoff(fn, options = {}) {
  const {
    maxAttempts = 3,
    initialDelay = 1000,
    backoffMultiplier = 2,
    shouldRetry = () => true
  } = options;

  let lastError;
  let delay = initialDelay;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      console.warn(`Attempt ${attempt}/${maxAttempts} failed:`, error.message);
      
      if (attempt === maxAttempts || !shouldRetry(error)) {
        break;
      }

      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= backoffMultiplier;
    }
  }

  throw lastError;
}

/**
 * Verify that a session is properly established and accessible
 */
export async function verifySessionEstablished(expectedUserId = null) {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.warn('Session verification error:', error);
      return { verified: false, error: error.message, session: null };
    }

    if (!session) {
      return { verified: false, error: 'No session found', session: null };
    }

    if (!session.access_token || !session.user?.id) {
      return { 
        verified: false, 
        error: 'Session missing required fields', 
        session 
      };
    }

    if (expectedUserId && session.user.id !== expectedUserId) {
      return { 
        verified: false, 
        error: 'Session user ID mismatch', 
        session 
      };
    }

    return { verified: true, error: null, session };
  } catch (error) {
    return { verified: false, error: error.message, session: null };
  }
}

/**
 * Set session tokens and wait for them to be properly established
 * Now uses synchronization to prevent race conditions
 */
export async function setSessionWithVerification(tokens, options = {}) {
  const { 
    maxWaitTime = 15000,
    verificationDelay = 200,
    userId = tokens.user?.id || 'unknown'
  } = options;

  console.log('🔄 [SESSION] Setting session tokens with synchronization...');
  
  // Use synchronized session setting to prevent conflicts
  return await synchronizedSetSession(tokens, {
    maxWaitTime,
    verificationDelay,
    userId
  });
}

/**
 * Edge function call with retry logic for network reliability
 */
export async function invokeEdgeFunctionWithRetry(functionName, payload, options = {}) {
  const { 
    maxAttempts = 3,
    initialDelay = 1000,
    timeoutPerAttempt = 10000
  } = options;

  return retryWithBackoff(
    async () => {
      console.log(`🔄 [EDGE-FUNCTION] Calling ${functionName}...`);
      
      // Create a timeout promise
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error(`Function call timeout after ${timeoutPerAttempt}ms`)), timeoutPerAttempt);
      });

      // Race between the function call and timeout
      const callPromise = supabase.functions.invoke(functionName, payload);
      
      const result = await Promise.race([callPromise, timeoutPromise]);

      console.log(`✅ [EDGE-FUNCTION] ${functionName} completed successfully`);
      return result;
    },
    {
      maxAttempts,
      initialDelay,
      shouldRetry: (error) => {
        // Retry on network errors but not on validation errors
        const message = error.message?.toLowerCase() || '';
        const shouldRetry = 
          message.includes('timeout') ||
          message.includes('network') ||
          message.includes('connection') ||
          message.includes('fetch');
        
        console.log(`🔍 [EDGE-FUNCTION] Should retry "${error.message}": ${shouldRetry}`);
        return shouldRetry;
      }
    }
  );
}

/**
 * Complete Telegram authentication flow with all reliability measures
 * Now uses synchronization to prevent race conditions
 */
export async function completeTelegramAuthFlow(telegramAuthData, options = {}) {
  const userId = `tg_${telegramAuthData?.id || 'unknown'}`;

  console.log('🚀 [TG-AUTH] Starting synchronized Telegram auth flow');

  // Use synchronized auth to prevent conflicts with other auth attempts
  return await synchronizedTelegramAuth(
    telegramAuthData,
    async () => {
      const startTime = Date.now();

      try {
        console.log('🔄 [TG-AUTH] Step 1: Edge function call with retry');
        const { data, error: invokeError } = await invokeEdgeFunctionWithRetry(
          'telegram-auth-callback',
          { body: { tgUserData: telegramAuthData } },
          options.edgeFunction
        );

        if (invokeError) {
          throw new Error(`Edge function error: ${invokeError.message}`);
        }

        if (!data.success) {
          throw new Error(`Auth failed: ${data.error || 'Unknown error'}`);
        }

        if (!data.session_token?.access_token || !data.session_token?.refresh_token) {
          throw new Error('Invalid session tokens received from server');
        }

        // Step 2: Set session with verification (also synchronized)
        console.log('🔄 [TG-AUTH] Step 2: Setting session with verification');
        const sessionResult = await setSessionWithVerification(
          data.session_token, 
          {
            ...options.session,
            userId
          }
        );

        if (!sessionResult.success) {
          throw new Error(`Session establishment failed: ${sessionResult.error}`);
        }

        const duration = Date.now() - startTime;
        console.log(`✅ [TG-AUTH] Complete auth flow successful in ${duration}ms`);

        return {
          success: true,
          session: sessionResult.session,
          duration,
          error: null
        };

      } catch (error) {
        const duration = Date.now() - startTime;
        console.error(`❌ [TG-AUTH] Auth flow failed after ${duration}ms:`, error);

        return {
          success: false,
          session: null,
          duration,
          error: error.message
        };
      }
    },
    {
      timeout: (options.edgeFunction?.timeoutPerAttempt || 10000) + (options.session?.maxWaitTime || 15000) + 10000
    }
  );
}