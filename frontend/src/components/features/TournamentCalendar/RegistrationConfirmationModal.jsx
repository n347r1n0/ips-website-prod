// src/components/features/TournamentCalendar/RegistrationConfirmationModal.jsx

import React, { useState } from 'react';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ModalBase } from '@/components/ui/ModalBase';
import { BuyInSummary } from './BuyInSummary';
import { BlindsStructureViewer } from './BlindsStructureViewer';
import { participantsAPI } from '@/lib/participantsAPI';
import { useAuth } from '@/contexts/AuthContext';
import { useGuestStore } from '@/lib/guestStore';
import { useToast } from '@/components/ui/Toast';

export function RegistrationConfirmationModal({ tournament, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user, profile } = useAuth();
  const { guestData } = useGuestStore();
  const toast = useToast();

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleConfirmRegistration = async () => {
    setLoading(true);
    setError(null);

    try {
      const registrationData = {
        tournamentId: tournament.id
      };

      if (user) {
        // Registered user
        registrationData.userId = user.id;
      } else if (guestData) {
        // Guest user
        registrationData.guestData = guestData;
      } else {
        throw new Error('Отсутствуют данные для регистрации');
      }

      await participantsAPI.registerForTournament(registrationData);
      
      // Note: Do NOT clear guest data here - preserve for re-registration

      // Show success message
      const playerName = profile?.nickname || guestData?.name || 'Игрок';
      toast.success(`${playerName}, вы успешно зарегистрированы на турнир!`);

      // Close modal and trigger success callback
      if (onSuccess) onSuccess();
      
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.message || 'Произошла ошибка при регистрации');
    } finally {
      setLoading(false);
    }
  };

  const playerName = profile?.nickname || guestData?.name;
  const playerContact = user?.email || guestData?.contact;

  return (
    <ModalBase
      isOpen={true}
      onClose={onClose}
      title="Подтверждение регистрации"
      subtitle={`${tournament.name} • ${formatDate(tournament.tournament_date)} • ${formatTime(tournament.tournament_date)}`}
      priority={true}
      footerActions={
        <>
          <Button
            onClick={onClose}
            disabled={loading}
            className="btn-glass px-6 py-3 rounded-xl"
          >
            Отмена
          </Button>
          <Button
            onClick={handleConfirmRegistration}
            disabled={loading || (!user && !guestData)}
            className="btn-clay luxury-button px-6 py-3 rounded-xl flex items-center"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
            ) : (
              <CheckCircle className="w-5 h-5 mr-2" />
            )}
            {loading ? 'Регистрация...' : 'Подтвердить регистрацию'}
          </Button>
        </>
      }
    >
      {/* You are signing in as... (compact line) */}
      <div className="mb-6 text-center">
        <p className="text-white/80 text-sm">
          Вы регистрируетесь как: <span className="text-white font-medium">{playerName || 'Не указано'}</span> • <span className="text-white/70">{playerContact || 'Контакт не указан'}</span>
        </p>
        <p className="text-gold-accent/80 text-xs mt-1">
          {user ? 'Участник клуба' : 'Гость'}
        </p>
      </div>

      {/* Tournament Details - Glass Cards */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Tournament Summary Glass Card */}
        <div className="glassmorphic-panel border border-white/10 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            📅 Информация о турнире
          </h3>
          <div className="space-y-3">
            <div>
              <span className="text-white/70 text-sm">Название:</span>
              <p className="text-white font-medium">{tournament.name}</p>
            </div>
            <div>
              <span className="text-white/70 text-sm">Дата и время:</span>
              <p className="text-white">{formatDate(tournament.tournament_date)}</p>
              <p className="text-white">{formatTime(tournament.tournament_date)}</p>
            </div>
            <div>
              <span className="text-white/70 text-sm">Формат:</span>
              <p className="text-white">{tournament.settings_json?.tournament_format || 'Стандартный'}</p>
            </div>
          </div>
        </div>

        {/* Buy-in & Rules Glass Card */}
        <BuyInSummary 
          buyInSettings={tournament.settings_json?.buy_in_settings}
          tournamentType={tournament.settings_json?.tournament_type}
          buyInCost={tournament.settings_json?.buy_in_cost}
        />
      </div>

      {/* Blinds Structure - Full width glass card */}
      <div className="mt-6">
        <BlindsStructureViewer 
          blindsStructure={tournament.settings_json?.blinds_structure}
        />
      </div>

      {/* Error Display */}
      {error && (
        <div className="mt-6 bg-red-500/20 border border-red-500/50 rounded-xl p-4 flex items-center">
          <AlertCircle className="w-5 h-5 text-red-300 mr-3 flex-shrink-0" />
          <p className="text-red-300">{error}</p>
        </div>
      )}

      {/* Info message for users without data */}
      {(!user && !guestData) && (
        <div className="mt-6 text-center">
          <p className="text-gray-400 text-sm">
            Для регистрации необходимо войти в систему или заполнить гостевую форму
          </p>
        </div>
      )}
    </ModalBase>
  );
}