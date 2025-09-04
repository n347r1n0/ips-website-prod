// frontend/src/contexts/AuthContext.jsx

import React, { createContext, useState, useEffect, useContext, useRef } from 'react';
import { supabase, authAPI, clubMembersAPI } from '@/lib/supabaseClient';
import { validatedStorage } from '@/lib/validatedStorage';
import { iosSafariUtils, addIOSVisibilityTracking } from '@/lib/iosSafariUtils';
import { completeTelegramAuthFlow } from '@/lib/sessionUtils';
import { preAuthCleanup } from '@/lib/preAuthCleanup';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const profileController = useRef(null);
  const isLoggingOut = useRef(false);
  const lastUserId = useRef(null);
  const visibilityCleanup = useRef(null);

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

  // Enhanced logout with iOS Safari specific handling
  const performCleanLogout = async () => {
    if (isLoggingOut.current) return;
    
    console.log('🚪 Enhanced logout starting...');
    isLoggingOut.current = true;

    // Cancel any ongoing requests
    profileController.current?.abort();

    // Clean local state first
    setUser(null);
    setProfile(null);
    setError(null);
    lastUserId.current = null;

    try {
      // Enhanced storage cleanup with iOS-specific handling
      const clearedCount = validatedStorage.purgeAllAuthArtifacts();
      console.log(`🧹 Logout: Cleared ${clearedCount} storage artifacts`);

      // iOS Safari specific context cleanup
      if (iosSafariUtils.isIOSSafari) {
        console.log('🍎 iOS Safari logout: Clearing context markers');
        iosSafariUtils.clearContextMarkers();
        iosSafariUtils.clearAuthArtifacts();
      }
    } catch (e) {
      console.warn('Storage cleanup warning:', e);
    }

    try {
      // Supabase logout (don't wait for it)
      supabase.auth.signOut().catch(() => {});
    } catch (e) {
      // Ignore errors
    }

    // iOS Safari gets longer delay for storage settling
    const delay = iosSafariUtils.isIOSSafari ? 300 : 100;
    
    setTimeout(() => {
      if (iosSafariUtils.isIOSSafari) {
        console.log('🍎 iOS Safari logout: Force reload with cache bust');
        // Force reload with cache busting for iOS Safari
        window.location.href = `${window.location.origin}/?_cb=${Date.now()}`;
      } else {
        window.location.replace('/');
      }
    }, delay);
  };

  // Enhanced auth state handler with iOS context tracking
  useEffect(() => {
    console.log('🔧 Auth listener starting...');
    
    // Add iOS Safari visibility tracking
    if (iosSafariUtils.isIOSSafari) {
      console.log('🍎 iOS Safari detected: Adding visibility tracking');
      visibilityCleanup.current = addIOSVisibilityTracking();
    }
    
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log(`🔔 [AUTH-CONTEXT] ${event} - User:`, {
          userId: session?.user?.id || 'none',
          userEmail: session?.user?.email || 'none',
          hasSession: !!session,
          currentProfileId: profile?.id || 'none',
          isLoggingOut: isLoggingOut.current,
          loading,
          isIOSSafari: iosSafariUtils.isIOSSafari
        });

        // Always ignore events during logout
        if (isLoggingOut.current) {
          console.log('🚫 [AUTH-CONTEXT] Ignoring event - logging out');
          return;
        }

        // iOS Safari: Check for context issues after backgrounding
        if (iosSafariUtils.isIOSSafari && event === 'SIGNED_IN') {
          const contextRefreshed = iosSafariUtils.refreshContextIfNeeded();
          if (contextRefreshed) {
            console.log('🍎 [AUTH-CONTEXT] iOS context was refreshed due to backgrounding');
          }
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
      // Clean up iOS visibility tracking
      if (visibilityCleanup.current) {
        visibilityCleanup.current();
        visibilityCleanup.current = null;
      }
    };
  }, [loading, profile]); // Minimal dependencies

  // Enhanced auth functions with pre-cleanup
  const signIn = async (data) => {
    try {
      // Clean up any stale auth state before attempting login
      await preAuthCleanup({ preserveGuestData: true });
      
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
    try {
      // Clean up any stale auth state before attempting signup
      await preAuthCleanup({ preserveGuestData: true });
      
      const result = await supabase.auth.signUp(data);
      if (result.error) {
        setError(result.error.message);
      }
      return result;
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  const signInWithTelegram = async (telegramUserData) => {
    setLoading(true);
    setError(null);

    try {
      console.log('🚀 [TG-SIGNIN] Starting reliable Telegram sign-in');

      // COMPREHENSIVE PRE-AUTH CLEANUP
      console.log('🧹 [TG-SIGNIN] Running comprehensive pre-auth cleanup...');
      await preAuthCleanup({ 
        preserveGuestData: true,
        preserveRedirectUrl: true 
      });

      // iOS Safari: Check context after cleanup
      if (iosSafariUtils.isIOSSafari) {
        console.log('🍎 [TG-SIGNIN] iOS Safari: Checking context after cleanup');
        const storageConsistency = iosSafariUtils.validateStorageConsistency();
        if (!storageConsistency.consistent) {
          console.warn('🍎 [TG-SIGNIN] iOS Safari storage inconsistency detected:', storageConsistency);
          iosSafariUtils.refreshContextIfNeeded();
        }
      }

      // Use the robust auth flow with retries
      const result = await completeTelegramAuthFlow(telegramUserData, {
        edgeFunction: {
          maxAttempts: 3,
          initialDelay: 1000,
          timeoutPerAttempt: 10000
        },
        session: {
          maxWaitTime: 15000,
          verificationDelay: 200
        }
      });

      if (!result.success) {
        throw new Error(result.error || 'Authentication flow failed');
      }

      console.log(`✅ [TG-SIGNIN] Reliable sign-in completed in ${result.duration}ms`);
      
      // Don't set loading to false here - let the auth state change handle it
      return { success: true, session: result.session };

    } catch (error) {
      console.error('❌ [TG-SIGNIN] Sign-in failed:', error);
      const errorMessage = `Telegram auth failed: ${error.message}`;
      setError(errorMessage);
      setLoading(false);
      throw new Error(errorMessage);
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
