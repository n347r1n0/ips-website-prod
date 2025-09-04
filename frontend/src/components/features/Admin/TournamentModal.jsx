// src/components/features/Admin/TournamentModal.jsx

import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle, ArrowLeft, Settings, DollarSign } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { tournamentsAPI } from '@/lib/supabaseClient';
import { BlindsStructurePreview } from './BlindsStructurePreview';
import { BlindsStructureEditor } from './BlindsStructureEditor';
import { BuyInSettingsEditor } from './BuyInSettingsEditor';

export function TournamentModal({ isOpen, onClose, tournament, onSuccess }) {
  const [view, setView] = useState('main');
  const [formData, setFormData] = useState({
    name: '',
    tournament_date: '',
    is_active_for_registration: true,
    tournament_type: 'Стандартный', // Calendar visual type
    is_major: false, // Special tournament flag
    settings_json: {
      tournament_format: 'Freezeout', // Poker play format (renamed from tournament_type)
      buy_in_cost: 0,
      blinds_structure: [],
      buy_in_settings: {}
    }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const toast = useToast();

  const isEditing = !!tournament;

  useEffect(() => {
    if (isOpen) {
      setView('main');
      if (tournament) {
        const date = new Date(tournament.tournament_date);
        const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
          .toISOString()
          .slice(0, 16);
        
        const existingSettings = tournament.settings_json || {};
        setFormData({
          name: tournament.name || '',
          tournament_date: localDate,
          is_active_for_registration: tournament.is_active_for_registration ?? true,
          tournament_type: tournament.tournament_type || 'Стандартный', // Calendar visual type
          is_major: tournament.is_major || false, // Special tournament flag
          settings_json: {
            tournament_format: existingSettings.tournament_format || existingSettings.tournament_type || 'Freezeout', // Poker format
            buy_in_cost: existingSettings.buy_in_cost || 0,
            blinds_structure: existingSettings.blinds_structure || [],
            buy_in_settings: existingSettings.buy_in_settings || {}
          }
        });
      } else {
        setFormData({
          name: '',
          tournament_date: '',
          is_active_for_registration: true,
          tournament_type: 'Стандартный', // Calendar visual type
          is_major: false, // Special tournament flag
          settings_json: {
            tournament_format: 'Freezeout', // Poker format
            buy_in_cost: 0,
            blinds_structure: [],
            buy_in_settings: {}
          }
        });
      }
      setError(null);
    }
  }, [isOpen, tournament]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSettingsChange = (updates) => {
    setFormData(prev => ({
      ...prev,
      settings_json: { ...prev.settings_json, ...updates }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError('Tournament name is required');
      return;
    }
    
    if (!formData.tournament_date) {
      setError('Tournament date is required');
      return;
    }


    try {
      setLoading(true);
      setError(null);

      const submitData = {
        name: formData.name.trim(),
        tournament_date: formData.tournament_date,
        is_active_for_registration: formData.is_active_for_registration,
        tournament_type: formData.tournament_type, // Calendar visual type
        is_major: formData.is_major, // Special tournament flag
        settings_json: formData.settings_json
      };

      if (isEditing) {
        await tournamentsAPI.updateTournament(tournament.id, submitData);
        toast.success(`Tournament "${submitData.name}" updated successfully`);
      } else {
        await tournamentsAPI.createTournament(submitData);
        toast.success(`Tournament "${submitData.name}" created successfully`);
      }

      onSuccess();
    } catch (err) {
      setError(`Failed to ${isEditing ? 'update' : 'create'} tournament: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const renderMainView = () => (
    <motion.div
      key="main"
      initial={{ x: 0 }}
      animate={{ x: 0 }}
      exit={{ x: -300, opacity: 0 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="w-full"
    >
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-heading text-white">
          {isEditing ? 'Edit Tournament' : 'Create New Tournament'}
        </h2>
        <Button
          onClick={onClose}
          className="glassmorphic-panel border-white/30 text-white hover:bg-white/10 p-2 rounded-xl"
        >
          <X className="w-5 h-5" />
        </Button>
      </div>

      {error && (
        <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4 mb-6 flex items-center">
          <AlertCircle className="w-5 h-5 text-red-300 mr-3 flex-shrink-0" />
          <p className="text-red-300">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Tournament Name *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            className="w-full glassmorphic-panel border border-white/30 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:border-gold-accent focus:ring-2 focus:ring-gold-accent/20 focus:outline-none"
            placeholder="Enter tournament name"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Tournament Date & Time *
          </label>
          <input
            type="datetime-local"
            value={formData.tournament_date}
            onChange={(e) => handleInputChange('tournament_date', e.target.value)}
            className="w-full glassmorphic-panel border border-white/30 rounded-xl px-4 py-3 text-white focus:border-gold-accent focus:ring-2 focus:ring-gold-accent/20 focus:outline-none"
            required
          />
        </div>

        <div>
          <label className="flex items-center space-x-3 text-gray-300 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.is_active_for_registration}
              onChange={(e) => handleInputChange('is_active_for_registration', e.target.checked)}
              className="w-4 h-4 text-gold-accent bg-transparent border-2 border-white/30 rounded focus:ring-gold-accent focus:ring-2"
            />
            <span>Active for Registration</span>
          </label>
        </div>

        <div className="glassmorphic-panel border border-white/30 rounded-xl p-6">
          <h3 className="text-lg font-heading text-white mb-4 flex items-center">
            <Settings className="w-5 h-5 mr-2 text-gold-accent" />
            Tournament Settings
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Calendar Icon Type
              </label>
              <select
                value={formData.tournament_type}
                onChange={(e) => handleInputChange('tournament_type', e.target.value)}
                className="w-full glassmorphic-panel border border-white/30 rounded-xl px-4 py-3 text-white focus:border-gold-accent focus:ring-2 focus:ring-gold-accent/20 focus:outline-none"
              >
                <option value="Стандартный">🎯 Стандартный (Target Icon - Teal)</option>
                <option value="Специальный">⭐ Специальный (Star Icon - Gold)</option>
                <option value="Фриролл">⚡ Фриролл (Lightning Icon - Red)</option>
                <option value="Рейтинговый">🏆 Рейтинговый (Trophy Icon - Gold)</option>
              </select>
              <p className="text-xs text-gray-400 mt-1">Determines the icon and color shown on the calendar</p>
            </div>

            <div>
              <label className="flex items-center space-x-3 text-gray-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_major}
                  onChange={(e) => handleInputChange('is_major', e.target.checked)}
                  className="w-4 h-4 text-gold-accent bg-transparent border-2 border-white/30 rounded focus:ring-gold-accent focus:ring-2"
                />
                <span>Major Tournament</span>
              </label>
              <p className="text-xs text-gray-400 mt-1 ml-7">Adds pulsing animation and special effects to calendar</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Poker Format
              </label>
              <select
                value={formData.settings_json.tournament_format}
                onChange={(e) => handleSettingsChange({ tournament_format: e.target.value })}
                className="w-full glassmorphic-panel border border-white/30 rounded-xl px-4 py-3 text-white focus:border-gold-accent focus:ring-2 focus:ring-gold-accent/20 focus:outline-none"
              >
                <option value="Freezeout">Freezeout</option>
                <option value="Re-buy">Re-buy</option>
                <option value="Re-entry">Re-entry</option>
              </select>
              <p className="text-xs text-gray-400 mt-1">Poker play style (separate from calendar appearance)</p>
            </div>

            <div className="flex space-x-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Buy-in Cost ($)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.settings_json.buy_in_cost}
                  onChange={(e) => handleSettingsChange({ buy_in_cost: parseFloat(e.target.value) || 0 })}
                  className="w-full glassmorphic-panel border border-white/30 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:border-gold-accent focus:ring-2 focus:ring-gold-accent/20 focus:outline-none"
                  placeholder="0.00"
                />
              </div>
              <div className="flex items-end">
                <Button
                  type="button"
                  onClick={() => setView('buyInConfig')}
                  className="glassmorphic-panel border-white/30 text-white hover:bg-white/10 px-4 py-3 rounded-xl flex items-center"
                >
                  <DollarSign className="w-4 h-4 mr-2" />
                  Configure Buy-ins
                </Button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Blinds Structure
              </label>
              <div className="flex space-x-4">
                <div className="flex-1">
                  <BlindsStructurePreview structure={formData.settings_json.blinds_structure} />
                </div>
                <div className="flex items-center">
                  <Button
                    type="button"
                    onClick={() => setView('blindsConfig')}
                    className="glassmorphic-panel border-white/30 text-white hover:bg-white/10 px-4 py-3 rounded-xl flex items-center"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Edit Structure
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex space-x-4">
          <Button
            type="submit"
            disabled={loading}
            className={`flex-1 luxury-button px-6 py-3 rounded-xl flex items-center justify-center ${
              loading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current" />
            ) : (
              <>
                <Save className="w-5 h-5 mr-2" />
                {isEditing ? 'Update Tournament' : 'Create Tournament'}
              </>
            )}
          </Button>
          <Button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="glassmorphic-panel border-white/30 text-white hover:bg-white/10 px-6 py-3 rounded-xl"
          >
            Cancel
          </Button>
        </div>
      </form>
    </motion.div>
  );

  const renderBlindsEditor = () => (
    <motion.div
      key="blinds"
      initial={{ x: 300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 300, opacity: 0 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="w-full"
    >
      <BlindsStructureEditor
        structure={formData.settings_json.blinds_structure}
        onUpdate={(structure) => handleSettingsChange({ blinds_structure: structure })}
        onBack={() => setView('main')}
      />
    </motion.div>
  );

  const renderBuyInEditor = () => (
    <motion.div
      key="buyin"
      initial={{ x: 300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 300, opacity: 0 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="w-full"
    >
      <BuyInSettingsEditor
        settings={formData.settings_json.buy_in_settings}
        onUpdate={(settings) => handleSettingsChange({ buy_in_settings: settings })}
        onBack={() => setView('main')}
      />
    </motion.div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative glassmorphic-panel rounded-2xl p-8 w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <AnimatePresence mode="wait">
          {view === 'main' && renderMainView()}
          {view === 'blindsConfig' && renderBlindsEditor()}
          {view === 'buyInConfig' && renderBuyInEditor()}
        </AnimatePresence>
      </div>
    </div>
  );
}
