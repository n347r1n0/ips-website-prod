/**
 * Session establishment utilities with retry logic for mobile reliability
 */

import { supabase } from './supabaseClient';

/**
 * Wait for a condition to be true with exponential backoff
 */
async function waitForCondition(conditionFn, options = {}) {
  const {
    maxAttempts = 10,
    initialDelay = 100,
    maxDelay = 3000,
    backoffMultiplier = 2,
    timeoutMs = 30000
  } = options;

  const startTime = Date.now();
  let attempt = 0;
  let delay = initialDelay;

  while (attempt < maxAttempts) {
    // Check timeout
    if (Date.now() - startTime > timeoutMs) {
      throw new Error(`Condition timeout after ${timeoutMs}ms`);
    }

    try {
      const result = await conditionFn();
      if (result) {
        return result;
      }
    } catch (error) {
      console.warn(`waitForCondition attempt ${attempt + 1} failed:`, error);
    }

    attempt++;
    
    if (attempt < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, delay));
      delay = Math.min(delay * backoffMultiplier, maxDelay);
    }
  }

  throw new Error(`Condition not met after ${maxAttempts} attempts`);
}

/**
 * Retry a function call with exponential backoff
 */
async function retryWithBackoff(fn, options = {}) {
  const {
    maxAttempts = 3,
    initialDelay = 1000,
    backoffMultiplier = 2,
    shouldRetry = (error) => true
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
 */
export async function setSessionWithVerification(tokens, options = {}) {
  const { 
    maxWaitTime = 15000,
    verificationDelay = 200 
  } = options;

  console.log('🔄 [SESSION] Setting session tokens...');
  
  // Set the session
  const { error: setError } = await supabase.auth.setSession({
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
  });

  if (setError) {
    console.error('❌ [SESSION] Failed to set session:', setError);
    throw new Error(`Failed to set session: ${setError.message}`);
  }

  console.log('✅ [SESSION] Session tokens set, verifying establishment...');

  // Wait for session to be properly established
  try {
    const result = await waitForCondition(
      async () => {
        const verification = await verifySessionEstablished();
        if (verification.verified) {
          console.log('✅ [SESSION] Session verified successfully');
          return verification.session;
        }
        console.log('🔄 [SESSION] Session not yet established, retrying...', verification.error);
        return null;
      },
      {
        maxAttempts: Math.ceil(maxWaitTime / verificationDelay),
        initialDelay: verificationDelay,
        maxDelay: verificationDelay,
        backoffMultiplier: 1, // Linear retry for session checks
        timeoutMs: maxWaitTime
      }
    );

    return { success: true, session: result, error: null };
  } catch (error) {
    console.error('❌ [SESSION] Session verification timeout:', error);
    return { success: false, session: null, error: error.message };
  }
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
 */
export async function completeTelegramAuthFlow(telegramAuthData, options = {}) {
  const startTime = Date.now();

  try {
    console.log('🚀 [TG-AUTH] Starting reliable Telegram auth flow');

    // Step 1: Call edge function with retry
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

    // Step 2: Set session with verification
    console.log('🔄 [TG-AUTH] Step 2: Setting session with verification');
    const sessionResult = await setSessionWithVerification(
      data.session_token, 
      options.session
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
}