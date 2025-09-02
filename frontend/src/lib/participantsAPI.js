// src/lib/participantsAPI.js

import { supabase } from '@/lib/supabaseClient';

export const participantsAPI = {
  /**
   * Register a user or guest for a tournament
   * @param {Object} params - Registration parameters
   * @param {number} params.tournamentId - Tournament ID
   * @param {string} [params.userId] - User ID for registered users
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
  }
};
