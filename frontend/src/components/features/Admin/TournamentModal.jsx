// src/components/features/Admin/TournamentModal.jsx

import React, { useState, useEffect } from 'react';
import { Save, AlertCircle, Settings, DollarSign } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { ModalBase } from '@/components/ui/ModalBase';
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
        
        // Handle backward compatibility for buy-in settings
        let buyInSettings = existingSettings.buy_in_settings || {};
        if (!buyInSettings.buyin && existingSettings.buy_in_cost) {
          buyInSettings = {
            ...buyInSettings,
            buyin: { amount: existingSettings.buy_in_cost }
          };
        }
        
        setFormData({
          name: tournament.name || '',
          tournament_date: localDate,
          is_active_for_registration: tournament.is_active_for_registration ?? true,
          tournament_type: tournament.tournament_type || 'Стандартный', // Calendar visual type
          is_major: tournament.is_major || false, // Special tournament flag
          settings_json: {
            tournament_format: existingSettings.tournament_format || existingSettings.tournament_type || 'Freezeout', // Poker format
            buy_in_cost: existingSettings.buy_in_cost || buyInSettings.buyin?.amount || 0,
            blinds_structure: existingSettings.blinds_structure || [],
            buy_in_settings: buyInSettings
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
    const newSettings = { ...formData.settings_json, ...updates };
    
    // Handle dual-write for backward compatibility
    if (updates.buy_in_settings && updates.buy_in_settings.buyin) {
      newSettings.buy_in_cost = updates.buy_in_settings.buyin.amount || 0;
    }
    
    setFormData(prev => ({
      ...prev,
      settings_json: newSettings
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
    <ModalBase
      isOpen={true}
      onClose={onClose}
      title={isEditing ? 'Edit Tournament' : 'Create New Tournament'}
      subtitle="Configure tournament details and settings"
      footerActions={
        <>
          <Button
            type="button"
            onClick={onClose}
            disabled={loading}
            variant="neutral"
            className="btn-clay px-6 py-3 rounded-xl"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className={`btn-clay luxury-button px-6 py-3 rounded-xl flex items-center ${
              loading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            onClick={handleSubmit}
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current mr-2" />
            ) : (
              <Save className="w-5 h-5 mr-2" />
            )}
            {loading ? 'Saving...' : (isEditing ? 'Update Tournament' : 'Create Tournament')}
          </Button>
        </>
      }
    >
      {/* Error Display */}
      {error && (
        <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4 mb-6 flex items-center">
          <AlertCircle className="w-5 h-5 text-red-300 mr-3 flex-shrink-0" />
          <p className="text-red-300">{error}</p>
        </div>
      )}

      <form className="space-y-6">
        {/* Basic Information Glass Card */}
        <div className="glassmorphic-panel border border-white/10 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Basic Information</h3>
          <div className="space-y-4">
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
          </div>
        </div>

        {/* Tournament Settings Glass Card */}
        <div className="glassmorphic-panel border border-white/10 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
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
          </div>
        </div>

        {/* Buy-in Configuration Glass Card */}
        <div className="glassmorphic-panel border border-white/10 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <DollarSign className="w-5 h-5 mr-2 text-gold-accent" />
            Buy-in Configuration
          </h3>
          
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
        </div>

        {/* Blinds Structure Glass Card */}
        <div className="glassmorphic-panel border border-white/10 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <Settings className="w-5 h-5 mr-2 text-deep-teal" />
            Blinds Structure
          </h3>
          
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
      </form>
    </ModalBase>
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

  const renderBuyInEditor = () => {
    const handleBuyInUpdate = (settings) => {
      handleSettingsChange({ buy_in_settings: settings });
    };

    return (
      <BuyInSettingsEditor
        settings={formData.settings_json.buy_in_settings}
        onUpdate={handleBuyInUpdate}
        onBack={() => setView('main')}
        format={formData.settings_json.tournament_format}
        blindsStructure={formData.settings_json.blinds_structure}
      />
    );
  };

  return (
    <>
      {/* Main Tournament Modal - Now using ModalBase */}
      {view === 'main' && renderMainView()}
      
      {/* Blinds Configuration Modal */}
      {view === 'blindsConfig' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setView('main')} />
          <div className="relative glassmorphic-panel rounded-2xl p-8 w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <AnimatePresence mode="wait">
              {renderBlindsEditor()}
            </AnimatePresence>
          </div>
        </div>
      )}
      
      {/* Buy-in Configuration Modal - Uses ModalBase with priority portal mounting */}
      {view === 'buyInConfig' && renderBuyInEditor()}
    </>
  );
}
