// frontend/src/lib/participantsAPI.js

import { supabase } from '@/lib/supabaseClient';

export const participantsAPI = {
  /**
   * Возвращает нормализованный список результатов для завершённого турнира.
   * Учитывает и членов клуба (nickname из club_members), и гостей (guest_name).
   */
  async getResultsByTournament(tournamentId) {
    if (!tournamentId) throw new Error('tournamentId is required');
    // На всякий случай — чтобы после OAuth/редиректа токен точно был подтянут
    await supabase.auth.getSession();

    // Пытаемся взять ник из club_members (LEFT JOIN по FK player_id)
    const { data, error } = await supabase
      .from('tournament_participants')
      .select(`
        id,
        player_id,
        guest_name,
        final_place,
        rating_points,
        club_members:player_id (
          nickname,
          full_name
        )
      `)
      .eq('tournament_id', tournamentId)
      .order('final_place', { ascending: true, nullsFirst: false });

    if (error) throw error;

    // Нормализация для удобной отрисовки
    return (data ?? []).map((r) => ({
      id: r.id,
      place: r.final_place,
      points: r.rating_points ?? 0,
      name:
        (Array.isArray(r.club_members) && r.club_members[0]?.nickname) ||
        (Array.isArray(r.club_members) && r.club_members[0]?.full_name) ||
        r.guest_name ||
        'Unknown',
      isMember: !!r.player_id,
    }));
  },

  /**
   * Register a user or guest for a tournament
   * @param {Object} params - Registration parameters
   * @param {number} params.tournamentId - Tournament ID
   * @param {string} [params.userId] - User ID for registered users (should be player_id)
   * @param {Object} [params.guestData] - Guest data for non-registered users
   * @param {string} params.guestData.name - Guest name
   * @param {string} params.guestData.contact - Guest contact info
   * @returns {Promise<Object>} Created tournament participant record
   */
  async registerForTournament({ tournamentId, userId, guestData }) {
    if (!tournamentId) {
      throw new Error('Tournament ID is required');
    }

    if (!userId && !guestData) {
      throw new Error('Either userId or guestData is required');
    }

    if (guestData && (!guestData.name || !guestData.contact)) {
      throw new Error('Guest name and contact are required');
    }

    // Check if already registered
    let checkQuery = supabase
      .from('tournament_participants')
      .select('id')
      .eq('tournament_id', tournamentId);

    if (userId) {
      checkQuery = checkQuery.eq('player_id', userId);
    } else {
      checkQuery = checkQuery
        .eq('guest_name', guestData.name);
    }

    const { data: existingRegistration } = await checkQuery.maybeSingle();

    if (existingRegistration) {
      throw new Error('Вы уже зарегистрированы на этот турнир');
    }

    // Create registration record
    const registrationData = {
      tournament_id: tournamentId,
      status: 'registered',
      created_at: new Date().toISOString()
    };

    if (userId) {
      // Registered user
      registrationData.player_id = userId;
    } else {
      // Guest user
      registrationData.guest_name = guestData.name;
      registrationData.guest_contact = guestData.contact;
    }

    const { data, error } = await supabase
      .from('tournament_participants')
      .insert([registrationData]);

    if (error) {
      console.error('Error registering for tournament:', error);
      throw new Error('Ошибка при регистрации на турнир');
    }

    return data;
  },

  /**
   * Get all participants for a tournament
   * @param {number} tournamentId - Tournament ID
   * @returns {Promise<Array>} Array of participants
   */
  async getTournamentParticipants(tournamentId) {
    const { data, error } = await supabase
      .from('tournament_participants')
      .select(`
        id,
        status,
        final_place,
        created_at,
        guest_name,
        guest_contact,
        club_members:player_id (
          nickname,
          full_name,
          avatar_url
        )
      `)
      .eq('tournament_id', tournamentId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching tournament participants:', error);
      throw error;
    }

    return data || [];
  },

  /**
   * Update participant status
   * @param {number} participantId - Participant ID
   * @param {Object} updates - Updates to apply
   * @returns {Promise<Object>} Updated participant record
   */
  async updateParticipant(participantId, updates) {
    const { data, error } = await supabase
      .from('tournament_participants')
      .update(updates)
      .eq('id', participantId)
      .select()
      .single();

    if (error) {
      console.error('Error updating participant:', error);
      throw error;
    }

    return data;
  },

  /**
   * Remove a participant from a tournament
   * @param {number} participantId - Participant ID
   * @returns {Promise<void>}
   */
  async removeParticipant(participantId) {
    const { error } = await supabase
      .from('tournament_participants')
      .delete()
      .eq('id', participantId);

    if (error) {
      console.error('Error removing participant:', error);
      throw error;
    }
  },

  /**
   * Check if a user or guest is registered for a tournament
   * @param {number} tournamentId - Tournament ID
   * @param {string} [userId] - User ID for registered users
   * @param {Object} [guestData] - Guest data with name and contact
   * @returns {Promise<Object|null>} Participant record if registered, null otherwise
   */
  async checkRegistration(tournamentId, userId = null, guestData = null) {
    if (!userId && !guestData) {
      throw new Error('Either userId or guestData is required');
    }

    let query = supabase
      .from('tournament_participants')
      .select('*')
      .eq('tournament_id', tournamentId);

    if (userId) {
      query = query.eq('player_id', userId);
    } else if (guestData) {
      // For guests, check both name and contact for stronger uniqueness
      query = query
        .eq('guest_name', guestData.name)
        .eq('guest_contact', guestData.contact);
    }

    const { data, error } = await query.maybeSingle();

    if (error) {
      console.error('Error checking registration:', error);
      throw error;
    }

    return data;
  }
};
