// frontend/src/lib/authDebug.js

import { supabase } from '@/lib/supabaseClient';

/**
 * Simple auth debugging utilities
 */
export const authDebug = {
  // Check current auth state
  async checkAuthState() {
    console.log('🔍 === AUTH DEBUG REPORT ===');
    
    try {
      // 1. Check Supabase session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      console.log('📋 Session:', session ? '✅ Valid' : '❌ None', sessionError ? `Error: ${sessionError.message}` : '');
      
      if (session) {
        console.log('👤 User ID:', session.user.id);
        console.log('📧 Email:', session.user.email || 'None');
        console.log('⏰ Expires:', new Date(session.expires_at * 1000).toLocaleString());
      }

      // 2. Check localStorage keys
      const sbKeys = Object.keys(localStorage).filter(k => k.startsWith('sb-'));
      console.log('💾 LocalStorage sb-* keys:', sbKeys.length, sbKeys);

      // 3. Check sessionStorage keys  
      const sessionKeys = Object.keys(sessionStorage).filter(k => 
        k.startsWith('sb-') || k.includes('auth') || k.includes('tg_oauth')
      );
      console.log('📝 SessionStorage keys:', sessionKeys.length, sessionKeys);

      // 4. Try to get user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      console.log('🔐 Current user:', user ? '✅ Authenticated' : '❌ None', userError ? `Error: ${userError.message}` : '');

      console.log('🔍 === END REPORT ===');
      
      return {
        hasSession: !!session,
        hasUser: !!user,
        localStorageKeys: sbKeys,
        sessionStorageKeys: sessionKeys,
        errors: [sessionError, userError].filter(Boolean)
      };
      
    } catch (error) {
      console.error('❌ Auth debug failed:', error);
      return { error: error.message };
    }
  },

  // Force clean logout for testing
  async forceCleanLogout() {
    console.log('🧹 Force cleaning all auth state...');
    
    try {
      // 1. Supabase logout
      await supabase.auth.signOut();
      console.log('✅ Supabase signOut completed');
    } catch (e) {
      console.warn('⚠️ Supabase signOut failed:', e);
    }

    try {
      // 2. Clean localStorage
      const sbKeys = Object.keys(localStorage).filter(k => k.startsWith('sb-'));
      sbKeys.forEach(key => localStorage.removeItem(key));
      localStorage.removeItem('tg_oauth_state_last');
      console.log(`✅ Cleaned ${sbKeys.length} localStorage keys`);
    } catch (e) {
      console.warn('⚠️ localStorage cleanup failed:', e);
    }

    try {
      // 3. Clean sessionStorage
      sessionStorage.removeItem('tg_oauth_state');
      const sessionKeys = Object.keys(sessionStorage).filter(k => k.includes('auth'));
      sessionKeys.forEach(key => sessionStorage.removeItem(key));
      console.log(`✅ Cleaned ${sessionKeys.length} sessionStorage keys`);
    } catch (e) {
      console.warn('⚠️ sessionStorage cleanup failed:', e);
    }

    console.log('🧹 Force cleanup complete. Reloading page...');
    window.location.replace('/');
  },

  // Test profile access
  async testProfileAccess() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('❌ No user to test profile access');
        return false;
      }

      console.log('🧪 Testing profile access for user:', user.id);
      
      // Import clubMembersAPI dynamically to avoid circular deps
      const { clubMembersAPI } = await import('./supabaseClient');
      const profile = await clubMembersAPI.getProfile(user.id);
      
      console.log('✅ Profile access successful:', { 
        nickname: profile?.nickname, 
        role: profile?.role 
      });
      
      return true;
    } catch (error) {
      console.log('❌ Profile access failed:', error.message);
      return false;
    }
  },

  // Monitor auth events
  startEventMonitor() {
    console.log('👀 Starting auth event monitor...');
    
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      console.log(`📢 AUTH EVENT: ${event}`, {
        hasSession: !!session,
        userId: session?.user?.id,
        timestamp: new Date().toISOString()
      });
    });

    // Return cleanup function
    return () => {
      console.log('🛑 Stopping auth event monitor');
      authListener.subscription.unsubscribe();
    };
  }
};

// Make available globally for debugging
if (typeof window !== 'undefined') {
  window.authDebug = authDebug;
  
  if (import.meta.env.DEV) {
    console.log('🛠️ Auth debugging available via window.authDebug');
    console.log('   • authDebug.checkAuthState() - Check current state');
    console.log('   • authDebug.forceCleanLogout() - Force clean logout');
    console.log('   • authDebug.testProfileAccess() - Test profile access');
    console.log('   • authDebug.startEventMonitor() - Monitor auth events');
  }
}
