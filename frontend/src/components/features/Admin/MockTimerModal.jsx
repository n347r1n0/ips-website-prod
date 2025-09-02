// src/components/features/Admin/MockTimerModal.jsx

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { tournamentsAPI, supabase } from '@/lib/supabaseClient'; // Убедитесь, что supabase экспортируется из клиента

export function MockTimerModal({ isOpen, onClose, onSuccess }) {
  const [tournaments, setTournaments] = useState([]);
  const [selectedTournamentId, setSelectedTournamentId] = useState('');
  const [loading, setLoading] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (isOpen) {
      const fetchTournaments = async () => {
        setLoading(true);
        try {
          const data = await tournamentsAPI.getCompletableTournaments();
          setTournaments(data);
        } catch (error) {
          toast.error('Failed to load tournaments for simulation.');
        } finally {
          setLoading(false);
        }
      };
      fetchTournaments();
    }
  }, [isOpen, toast]);

  const handleSimulate = async () => {
    if (!selectedTournamentId) {
      toast.warning('Please select a tournament to simulate.');
      return;
    }

    setSimulating(true);
    try {
      const { data, error } = await supabase.functions.invoke('mock-tournament-ender', {
        body: { tournament_id: selectedTournamentId },
      });

      if (error) throw error;

      if (data.success) {
        toast.success(data.message || 'Tournament simulation completed successfully!');
        onSuccess(); // Обновляем список турниров на главной странице
        handleClose();
      } else {
        throw new Error(data.error || 'An unknown error occurred.');
      }

    } catch (error) {
      toast.error(`Simulation failed: ${error.message}`);
    } finally {
      setSimulating(false);
    }
  };

  const handleClose = () => {
    setSelectedTournamentId('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="glassmorphic-panel rounded-2xl p-8 w-full max-w-md border border-white/20">
        <h2 className="text-2xl font-heading text-white mb-4">Timer Simulator</h2>
        <p className="text-gray-300 mb-6">
          Select a tournament to simulate its completion. This will generate random results and is irreversible.
        </p>

        {loading ? (
          <div className="text-center p-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold-accent mx-auto"></div>
            <p className="text-gray-400 mt-2">Loading tournaments...</p>
          </div>
        ) : (
          <div className="space-y-4">
            <select
              value={selectedTournamentId}
              onChange={(e) => setSelectedTournamentId(e.target.value)}
              className="w-full bg-slate-800/50 text-white rounded-lg p-3 border border-white/20 focus:ring-2 focus:ring-gold-accent focus:outline-none"
              disabled={simulating}
            >
              <option value="">-- Select a Tournament --</option>
              {tournaments.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
            <p className="text-xs text-gray-500">
              Only tournaments with 'scheduled' or 'registration_open' status are shown.
            </p>
          </div>
        )}

        <div className="mt-8 flex justify-end space-x-4">
          <Button
            onClick={handleClose}
            className="glassmorphic-panel border-white/30 text-white hover:bg-white/10 px-6 py-2 rounded-xl"
            disabled={simulating}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSimulate}
            className="luxury-button px-6 py-2 rounded-xl"
            disabled={simulating || loading || !selectedTournamentId}
          >
            {simulating ? 'Simulating...' : 'Run Simulation'}
          </Button>
        </div>
      </div>
    </div>
  );
}
