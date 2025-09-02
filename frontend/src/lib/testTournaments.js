// src/lib/testTournaments.js
// Simple script to test tournament data existence

import { supabase } from '@/lib/supabaseClient';

export const testTournamentData = async () => {
  console.log('🧪 [TEST] Starting tournament data test...');
  
  try {
    // Test 1: Basic table access
    const { data: allData, error: allError, count } = await supabase
      .from('tournaments')
      .select('*', { count: 'exact' });
      
    console.log('🧪 [TEST] All tournaments:', {
      count,
      rowCount: allData?.length,
      error: allError?.message || null,
      tournaments: allData?.map(t => ({
        id: t.id,
        name: t.name,
        date: t.tournament_date,
        active: t.is_active_for_registration
      }))
    });
    
    // Test 2: Check if any tournaments exist with current/future dates
    const now = new Date().toISOString();
    const { data: futureData, error: futureError } = await supabase
      .from('tournaments')
      .select('*')
      .gte('tournament_date', now);
      
    console.log('🧪 [TEST] Future tournaments:', {
      count: futureData?.length,
      error: futureError?.message || null,
      tournaments: futureData?.map(t => ({
        id: t.id,
        name: t.name,
        date: t.tournament_date,
        active: t.is_active_for_registration
      }))
    });
    
    // Test 3: Test with current month filter (like calendar does)
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const from = new Date(Date.UTC(year, month, 1)).toISOString();
    const to = new Date(Date.UTC(year, month + 1, 1)).toISOString();
    
    const { data: monthData, error: monthError } = await supabase
      .from('tournaments')
      .select('id, name, tournament_date')
      .gte('tournament_date', from)
      .lt('tournament_date', to)
      .order('tournament_date', { ascending: true });
      
    console.log('🧪 [TEST] Current month tournaments:', {
      from,
      to,
      count: monthData?.length,
      error: monthError?.message || null,
      tournaments: monthData
    });
    
    return {
      all: allData,
      future: futureData,
      currentMonth: monthData,
      errors: { allError, futureError, monthError }
    };
    
  } catch (error) {
    console.error('🧪 [TEST] Test failed:', error);
    return { error };
  }
};

// Make available globally for console testing
if (typeof window !== 'undefined') {
  window.testTournamentData = testTournamentData;
}