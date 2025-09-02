// frontend/src/contexts/AuthContext.jsx

import React, { createContext, useState, useEffect, useContext, useRef } from 'react';
import { supabase, authAPI, clubMembersAPI } from '@/lib/supabaseClient';
import { validatedStorage } from '@/lib/validatedStorage';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const profileController = useRef(null);
  const isLoggingOut = useRef(false);
  const lastUserId = useRef(null);

  // Simple profile loading - no complex logic
  const loadUserProfile = async (user) => {
    console.log('🔄 [PROFILE-LOAD] Starting profile load for:', {
      userId: user?.id,
      userEmail: user?.email,
      isLoggingOut: isLoggingOut.current,
      lastUserId: lastUserId.current,
      hasExistingProfile: !!profile
    });

    if (!user || isLoggingOut.current) {
      console.log('❌ [PROFILE-LOAD] Early exit - no user or logging out');
      setProfile(null);
      return;
    }

    // Avoid duplicate profile loads for the same user
    if (lastUserId.current === user.id && profile) {
      console.log('⏭️ [PROFILE-LOAD] Profile already loaded for user:', user.id);
      return;
    }

    try {
      // Cancel previous profile request
      profileController.current?.abort();
      profileController.current = new AbortController();

      console.log('🔍 [PROFILE-LOAD] Querying club_members for user:', user.id);
      const memberProfile = await clubMembersAPI.getProfile(
        user.id, 
        profileController.current.signal
      );
      
      console.log('📊 [PROFILE-LOAD] Query result:', {
        found: !!memberProfile,
        profileId: memberProfile?.id,
        nickname: memberProfile?.nickname,
        role: memberProfile?.role,
        telegramId: memberProfile?.telegram_id
      });
      
      setProfile(memberProfile);
      lastUserId.current = user.id;
      console.log('✅ [PROFILE-LOAD] Profile loaded and set for user:', user.id, 'role:', memberProfile?.role);
      
    } catch (profileError) {
      if (profileError.name !== 'AbortError') {
        console.error('❌ [PROFILE-LOAD] Profile loading failed:', {
          error: profileError.message,
          code: profileError.code,
          userId: user.id
        });
        setProfile(null);
        lastUserId.current = null;
      } else {
        console.log('⏹️ [PROFILE-LOAD] Profile load aborted');
      }
    }
  };

  // Ultra-simple logout - just clean everything
  const performCleanLogout = async () => {
    if (isLoggingOut.current) return;
    
    console.log('🚪 Simple logout...');
    isLoggingOut.current = true;

    // Cancel any ongoing requests
    profileController.current?.abort();

    // Clean local state first
    setUser(null);
    setProfile(null);
    setError(null);
    lastUserId.current = null;

    try {
      // Clean storage
      validatedStorage.purgeAllAuthArtifacts();
    } catch (e) {
      console.warn('Storage cleanup warning:', e);
    }

    try {
      // Supabase logout (don't wait for it)
      supabase.auth.signOut().catch(() => {});
    } catch (e) {
      // Ignore errors
    }

    // Simple page reload after a tiny delay
    setTimeout(() => {
      window.location.replace('/');
    }, 100);
  };

  // Minimal auth state handler
  useEffect(() => {
    console.log('🔧 Auth listener starting...');
    
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log(`🔔 [AUTH-CONTEXT] ${event} - User:`, {
          userId: session?.user?.id || 'none',
          userEmail: session?.user?.email || 'none',
          hasSession: !!session,
          currentProfileId: profile?.id || 'none',
          isLoggingOut: isLoggingOut.current,
          loading
        });

        // Always ignore events during logout
        if (isLoggingOut.current) {
          console.log('🚫 [AUTH-CONTEXT] Ignoring event - logging out');
          return;
        }

        const currentUser = session?.user ?? null;
        
        // Simple state updates
        console.log('📝 [AUTH-CONTEXT] Setting user state:', !!currentUser);
        setUser(currentUser);

        if (currentUser) {
          // Only load profile on SIGNED_IN or if we don't have one
          const shouldLoadProfile = event === 'SIGNED_IN' || !profile || lastUserId.current !== currentUser.id;
          console.log('🔍 [AUTH-CONTEXT] Profile loading decision:', {
            event,
            shouldLoad: shouldLoadProfile,
            hasProfile: !!profile,
            lastUserId: lastUserId.current,
            currentUserId: currentUser.id
          });
          
          if (shouldLoadProfile) {
            console.log('⏳ [AUTH-CONTEXT] Starting async profile load for user:', currentUser.id);
            // DON'T AWAIT - let profile loading happen in parallel
            loadUserProfile(currentUser).catch(error => {
              console.error('❌ [AUTH-CONTEXT] Profile loading failed:', error);
            });
          } else {
            console.log('⏭️ [AUTH-CONTEXT] Skipping profile load');
          }
        } else {
          // No user - clear everything
          console.log('🧹 [AUTH-CONTEXT] Clearing user data');
          setProfile(null);
          lastUserId.current = null;
        }

        // Turn off loading after first event
        if (loading) {
          console.log('✅ [AUTH-CONTEXT] Turning off loading state');
          setLoading(false);
        }
        
        console.log('🏁 [AUTH-CONTEXT] Event processing complete');
      }
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [loading, profile]); // Minimal dependencies

  // Simple auth functions
  const signIn = async (data) => {
    try {
      const result = await supabase.auth.signInWithPassword(data);
      if (result.error) {
        setError(result.error.message);
      }
      return result;
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  const signUp = async (data) => {
    const result = await supabase.auth.signUp(data);
    if (result.error) {
      setError(result.error.message);
    }
    return result;
  };

  const signInWithTelegram = async (telegramUserData) => {
    setLoading(true);
    try {
      setError(null);

      const { data, error: invokeError } = await supabase.functions.invoke(
        'telegram-auth-callback',
        { body: { tgUserData: telegramUserData } }
      );

      if (invokeError) throw new Error(invokeError.message || 'Telegram auth failed');
      if (!data.success) throw new Error(data.error || 'Unknown error');

      if (data.session_token) {
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: data.session_token.access_token,
          refresh_token: data.session_token.refresh_token,
        });

        if (sessionError) throw new Error('Failed to set session');
      } else {
        setLoading(false);
        throw new Error('No session token');
      }

      return { success: true, ...data };
    } catch (error) {
      setError(`Telegram error: ${error.message}`);
      setLoading(false);
      throw error;
    }
  };

  const signOut = async () => {
    await performCleanLogout();
  };

  const value = {
    user,
    profile,
    loading,
    error,
    signIn,
    signUp,
    signOut,
    signInWithTelegram,
    nickname: profile?.nickname,
    role: profile?.role,
    isAdmin: profile?.role === 'admin',
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
