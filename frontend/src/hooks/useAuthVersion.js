// src/hooks/useAuthVersion.js
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

function getAuthVersionBus() {
  if (typeof window === 'undefined') return null; // SSR guard
  const w = window;
  if (w.__AUTH_VER_BUS__) return w.__AUTH_VER_BUS__;

  let version = 0;
  let initialized = false;
  const listeners = new Set();
  const bump = () => { version += 1; listeners.forEach(cb => cb(version)); };

  // If a session already exists when this bus is created, bump immediately.
  // Critical for post-OAuth redirect when the component mounts AFTER SIGNED_IN.
  supabase.auth.getSession().then(({ data }) => {
    if (data?.session) {
      // console.log('[AUTH-VER] Session present on init -> bump');
      bump();
    }
  });

  const { data: { subscription } } =
    supabase.auth.onAuthStateChange((event) => {
      // console.log(`[AUTH-VER] Event: ${event} -> bump`);
      bump();
      if (!initialized) initialized = true;
    });

  w.__AUTH_VER_BUS__ = {
    subscribe(cb) { listeners.add(cb); cb(version); return () => listeners.delete(cb); },
    getVersion: () => version,
    destroy() { subscription.unsubscribe(); delete w.__AUTH_VER_BUS__; }
  };
  return w.__AUTH_VER_BUS__;
}

export function useAuthVersion() {
  const [v, setV] = useState(0);
  useEffect(() => {
    const bus = getAuthVersionBus();
    if (!bus) return;
    return bus.subscribe(setV);
  }, []);
  return v;
}