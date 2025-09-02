// frontend/src/lib/supabaseClient.js

import { createClient } from '@supabase/supabase-js'
import { validatedStorage } from './validatedStorage.js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

console.log("CHECKING ENV VARS -> Supabase URL:", supabaseUrl);
console.log("CHECKING ENV VARS -> Supabase Key:", supabaseAnonKey ? "Key Found" : "Key NOT Found or empty");

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: validatedStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// ===== DATABASE HELPER FUNCTIONS FOR NEW NORMALIZED SCHEMA =====

// Club Members Table Operations (public.club_members)
export const clubMembersAPI = {
  // --- ИЗМЕНЕНИЯ ТОЛЬКО ЗДЕСЬ ---
  async getProfile(userId, signal) {
    const { data, error } = await supabase
      .from('club_members')
      .select('*') // Выбираем все поля, включая role
      .eq('user_id', userId)
      .maybeSingle()
      .abortSignal(signal); // ✅ ПРАВИЛЬНЫЙ СПОСОБ ПЕРЕДАЧИ СИГНАЛА

    if (error) {
      if (error.name !== 'AbortError') {
        console.error('Error fetching club member profile:', error);
      }
      throw error;
    }
    return data;
  },
  // --- КОНЕЦ ИЗМЕНЕНИЙ ---

  // Обновить профиль по user_id
  async updateProfile(userId, updates = {}) {
    const allowedUpdates = (({ nickname, full_name, avatar_url, telegram_id, telegram_username }) => ({
      ...(nickname !== undefined && { nickname }),
      ...(full_name !== undefined && { full_name }),
      ...(avatar_url !== undefined && { avatar_url }),
      ...(telegram_id !== undefined && { telegram_id }),
      ...(telegram_username !== undefined && { telegram_username }),
    }))(updates);

    if (Object.keys(allowedUpdates).length === 0) {
        console.log("No valid fields to update.");
        return null;
    }

    const { data, error } = await supabase
      .from('club_members')
      .update(allowedUpdates)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};

// Tournaments Table Operations (public.tournaments)
export const tournamentsAPI = {
  // ... (остальной код без изменений)

    // --- НАЧАЛО ДОБАВЛЕНИЯ ---
  /**
   * Fetches tournaments that are eligible for completion/simulation.
   * @returns {Promise<Array>} A list of tournaments with 'scheduled' or 'registration_open' status.
   */
  async getCompletableTournaments() {
    const { data, error } = await supabase
      .from('tournaments')
      .select('id, name')
      .in('status', ['scheduled', 'registration_open'])
      .order('tournament_date', { ascending: true });

    if (error) {
      console.error('Error fetching completable tournaments:', error);
      throw error;
    }
    return data;
  },
  // --- КОНЕЦ ДОБАВЛЕНИЯ ---


  async getActiveTournaments() {
    const { data, error } = await supabase
      .from('tournaments')
      .select('*')
      .eq('is_active_for_registration', true)
      .order('tournament_date', { ascending: true });

    if (error) throw error;
    return data || [];
  },
  async getTournament(id) {
    const { data, error } = await supabase
      .from('tournaments')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },
  async getAllTournaments() {
    const { data, error } = await supabase
      .from('tournaments')
      .select('*')
      .order('tournament_date', { ascending: false });

    if (error) throw error;
    return data || [];
  },
  async createTournament(tournamentData) {
    const { data, error } = await supabase
      .from('tournaments')
      .insert([tournamentData])
      .select()
      .single();

    if (error) throw error;
    return data;
  },
  async updateTournament(id, updates) {
    const { data, error } = await supabase
      .from('tournaments')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },
  async deleteTournament(id) {
    const { error } = await supabase
      .from('tournaments')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },
  async findNearestTournament() {
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('tournaments')
      .select('id')
      .eq('is_active_for_registration', true)
      .gte('tournament_date', now)
      .order('tournament_date', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return data?.id || null;
  }
};

// Authentication Helper Functions
export const authAPI = {
  // ... (остальной код без изменений)
  async signUpClubMember(email, password, nickname) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          nickname: nickname,
          full_name: nickname
        }
      }
    });

    if (error) throw error;
    return data;
  },
  async getCurrentUserWithProfile() {
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError) throw authError;
    if (!user) return { user: null, profile: null };

    try {
      const profile = await clubMembersAPI.getProfile(user.id);
      return { user, profile };
    } catch (profileError) {
      return { user, profile: null };
    }
  }
};

