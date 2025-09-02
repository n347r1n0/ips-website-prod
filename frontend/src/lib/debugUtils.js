// src/lib/debugUtils.js

import { supabase } from '@/lib/supabaseClient';

/**
 * Debug utility to test tournament queries with detailed logging
 */
export const debugTournamentQuery = async (label = 'DEBUG') => {
  console.log(`[${label}] Starting tournament query debug...`);
  
  try {
    // Check session state
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    const session = sessionData?.session;
    
    console.log(`[${label}] Session info:`, {
      hasSession: !!session,
      userId: session?.user?.id || 'none',
      userEmail: session?.user?.email || 'none',
      sessionError: sessionError?.message || null
    });
    
    // Check user info
    const { data: userData, error: userError } = await supabase.auth.getUser();
    console.log(`[${label}] User info:`, {
      hasUser: !!userData?.user,
      userId: userData?.user?.id || 'none',
      userError: userError?.message || null
    });
    
    // Test a simple tournament query
    const { data, error, count } = await supabase
      .from('tournaments')
      .select('*', { count: 'exact' });
      
    console.log(`[${label}] Tournament query result:`, {
      rowCount: data?.length ?? 0,
      totalCount: count,
      error: error ? {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      } : null,
      firstTournament: data?.[0] || null
    });
    
    // Test with date filtering (current month)
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const from = new Date(Date.UTC(year, month, 1)).toISOString();
    const to = new Date(Date.UTC(year, month + 1, 1)).toISOString();
    
    const { data: filteredData, error: filteredError } = await supabase
      .from('tournaments')
      .select('id, name, tournament_date')
      .gte('tournament_date', from)
      .lt('tournament_date', to)
      .order('tournament_date', { ascending: true });
      
    console.log(`[${label}] Filtered tournament query (${from} to ${to}):`, {
      rowCount: filteredData?.length ?? 0,
      error: filteredError?.message || null,
      tournaments: filteredData || []
    });
    
    return {
      session,
      user: userData?.user,
      allTournaments: data,
      filteredTournaments: filteredData,
      errors: { sessionError, userError, error, filteredError }
    };
    
  } catch (err) {
    console.error(`[${label}] Debug query failed:`, err);
    return { error: err };
  }
};

/**
 * Add this function to window for manual testing in browser console
 */
if (typeof window !== 'undefined') {
  window.debugTournamentQuery = debugTournamentQuery;
}