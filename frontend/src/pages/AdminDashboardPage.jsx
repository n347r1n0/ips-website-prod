// frontend/src/pages/AdminDashboardPage.jsx

import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Calendar, Users, Bot } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/contexts/AuthContext';
import { tournamentsAPI } from '@/lib/supabaseClient';
import { TournamentModal } from '@/components/features/Admin/TournamentModal';
import { DeleteConfirmModal } from '@/components/features/Admin/DeleteConfirmModal';
import { MockTimerModal } from '@/components/features/Admin/MockTimerModal';

export function AdminDashboardPage() {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMockModalOpen, setIsMockModalOpen] = useState(false);
  const [editingTournament, setEditingTournament] = useState(null);
  const [deletingTournament, setDeletingTournament] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const toast = useToast();
  const { isAdmin } = useAuth();

  const loadTournaments = async () => {
    try {
      setLoading(true);
      const data = await tournamentsAPI.getAllTournaments();
      setTournaments(data);
    } catch (err) {
      setError(`Failed to load tournaments: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTournaments();
  }, []);

  const handleCreateTournament = () => {
    setEditingTournament(null);
    setIsModalOpen(true);
  };

  const handleEditTournament = (tournament) => {
    setEditingTournament(tournament);
    setIsModalOpen(true);
  };

  const handleDeleteTournament = (tournament) => {
    setDeletingTournament(tournament);
  };

  const confirmDelete = async () => {
    if (!deletingTournament) return;
    
    try {
      setActionLoading(true);
      
      // Check admin permissions (handled by AdminRoute component)
      if (!isAdmin) {
        toast.error('Admin privileges required');
        return;
      }
      
      await tournamentsAPI.deleteTournament(deletingTournament.id);
      await loadTournaments();
      toast.success(`Tournament "${deletingTournament.name}" deleted successfully`);
      setDeletingTournament(null);
    } catch (err) {
      toast.error(`Failed to delete tournament: ${err.message}`);
      setError(`Failed to delete tournament: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleModalSuccess = async () => {
    setIsModalOpen(false);
    setEditingTournament(null);
    await loadTournaments();
  };

  // --- ИЗМЕНЕНИЕ: Обработчик успеха для модального окна симулятора ---
  const handleMockSuccess = async () => {
    setIsMockModalOpen(false);
    await loadTournaments();
  };


  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const statusDisplay = {
    scheduled: { text: 'Scheduled', color: 'bg-blue-400' },
    registration_open: { text: 'Registration', color: 'bg-green-400' },
    late_registration: { text: 'Late Reg', color: 'bg-yellow-400' },
    live_no_registration: { text: 'Live', color: 'bg-red-500' },
    completed: { text: 'Completed', color: 'bg-purple-400' },
    canceled: { text: 'Canceled', color: 'bg-gray-500' }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="glassmorphic-panel p-8 rounded-2xl">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold-accent mx-auto"></div>
          <p className="text-center text-gray-300 mt-4">Loading tournaments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 py-12 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="glassmorphic-panel rounded-2xl p-8 mb-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-heading text-white mb-2">Tournament Management</h1>
              <p className="text-gray-300">Manage all club tournaments from this admin panel</p>
            </div>
            <div className="flex items-center space-x-4">
              <Button onClick={() => setIsMockModalOpen(true)} className="glassmorphic-panel border-white/30 text-white hover:bg-white/10 px-6 py-3 rounded-xl flex items-center">
                <Bot className="w-5 h-5 mr-2" />
                Timer Simulator
              </Button>
              <Button onClick={handleCreateTournament} className="luxury-button px-6 py-3 rounded-xl flex items-center">
                <Plus className="w-5 h-5 mr-2" />
                Create New Tournament
              </Button>
            </div>
          </div>

          {error && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4 mb-6">
              <p className="text-red-300">{error}</p>
              <Button 
                onClick={() => setError(null)} 
                className="mt-2 text-sm text-red-300 hover:text-white"
              >
                Dismiss
              </Button>
            </div>
          )}

          <div className="space-y-4">
            {tournaments.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                <p className="text-gray-400 text-lg">No tournaments found</p>
                <p className="text-gray-500 text-sm">Create your first tournament to get started</p>
              </div>
            ) : (
              tournaments.map((tournament) => (
                <GlassPanel key={tournament.id}>
                  <div className="flex justify-between items-center">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-white mb-2">{tournament.name}</h3>
                      <div className="flex items-center space-x-6 text-sm text-gray-300">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          {formatDate(tournament.tournament_date)}
                        </div>
                        <div className="flex items-center">
                          {(() => {
                            // Получаем объект с текстом и цветом для текущего статуса
                            const display = statusDisplay[tournament.status] || { text: 'Unknown', color: 'bg-gray-700' };
                            return (
                              <>
                                <div className={`w-3 h-3 rounded-full mr-2 ${display.color}`} />
                                {display.text}
                              </>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-3">
                      <Button 
                        onClick={() => handleEditTournament(tournament)}
                        className="glassmorphic-panel border-white/30 text-white hover:bg-white/10 px-4 py-2 rounded-xl"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        onClick={() => handleDeleteTournament(tournament)}
                        className="glassmorphic-panel border-red-500/30 text-red-300 hover:bg-red-500/10 px-4 py-2 rounded-xl"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </GlassPanel>
              ))
            )}
          </div>
        </div>
      </div>

      <TournamentModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingTournament(null);
        }}
        tournament={editingTournament}
        onSuccess={handleModalSuccess}
      />

      <DeleteConfirmModal
        isOpen={!!deletingTournament}
        onClose={() => setDeletingTournament(null)}
        onConfirm={confirmDelete}
        tournamentName={deletingTournament?.name}
        loading={actionLoading}
      />

      <MockTimerModal
        isOpen={isMockModalOpen}
        onClose={() => setIsMockModalOpen(false)}
        onSuccess={handleMockSuccess}
      />

    </div>
  );
}
