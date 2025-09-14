// src/components/features/Admin/BuyInSettingsEditor.jsx

import React, { useState } from 'react';
import { DollarSign, Users, Clock, Coffee, Save } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ModalBase } from '@/components/ui/ModalBase';

// Format constraints helper
function getFormatConstraints(format) {
  switch (format) {
    case 'Freezeout':
      return 'Freezeout: no re-entry, no rebuy, no add-on.';
    case 'Re-entry':
      return 'Re-entry format: players can re-enter before the deadline.';
    case 'Re-buy':
      return 'Rebuy format: players can rebuy chips during specified periods.';
    default:
      return '';
  }
}

// Bottom Summary Component
function BuyInSummary({ settings, format }) {
  const bullets = [];

  // Buy-in
  if (settings.buyin?.amount) {
    const summary = `Buy-in: $${settings.buyin.amount}`;
    const extras = [];
    if (settings.buyin.rakePercent) extras.push(`${settings.buyin.rakePercent}% rake`);
    if (settings.buyin.startingStack) extras.push(`${settings.buyin.startingStack} chips`);
    bullets.push(summary + (extras.length ? ` (${extras.join(', ')})` : ''));
  }

  // Late Registration
  if (settings.late_registration?.enabled) {
    let timing = '';
    if (settings.late_registration.until_level) timing = `until level ${settings.late_registration.until_level}`;
    else if (settings.late_registration.until_minutes) timing = `${settings.late_registration.until_minutes}min after start`;
    bullets.push(`Late Registration ${timing}`);
  }

  // Re-entry (only if format includes it)
  if (format === 'Re-entry' && settings.re_entry) {
    let details = 'Re-entry allowed';
    const extras = [];
    if (settings.re_entry.max_entries_per_player) {
      extras.push(`max ${settings.re_entry.max_entries_per_player} per player`);
    } else {
      extras.push('unlimited');
    }
    if (settings.re_entry.closes_until_level) extras.push(`until level ${settings.re_entry.closes_until_level}`);
    else if (settings.re_entry.closes_after_minutes) extras.push(`${settings.re_entry.closes_after_minutes}min after start`);
    if (extras.length) details += ` (${extras.join(', ')})`;
    bullets.push(details);
  }

  // Rebuy (only if format includes it)
  if (format === 'Re-buy' && settings.rebuy) {
    let details = `Rebuy: $${settings.rebuy.price || 0}`;
    const extras = [];
    if (settings.rebuy.chips) extras.push(`${settings.rebuy.chips} chips`);
    if (settings.rebuy.max_rebuys_per_player) {
      extras.push(`max ${settings.rebuy.max_rebuys_per_player}`);
    } else {
      extras.push('unlimited');
    }
    if (settings.rebuy.ends_until_level) extras.push(`until level ${settings.rebuy.ends_until_level}`);
    else if (settings.rebuy.ends_after_minutes) extras.push(`${settings.rebuy.ends_after_minutes}min after start`);
    if (extras.length) details += ` (${extras.join(', ')})`;
    bullets.push(details);
  }

  // Add-on (only if format includes it)
  if (format === 'Re-buy' && settings.add_on) {
    let details = `Add-on: $${settings.add_on.price || 0}`;
    if (settings.add_on.chips) details += ` (${settings.add_on.chips} chips)`;
    if (settings.add_on.when) details += ` at ${settings.add_on.when}`;
    bullets.push(details);
  }

  if (bullets.length === 0) {
    bullets.push('Basic tournament structure');
  }

  return (
    <div className="glassmorphic-panel rounded-xl p-4 border border-white/10">
      <h4 className="text-sm font-semibold text-gold-accent mb-3 flex items-center">
        <DollarSign className="w-4 h-4 mr-2" />
        Tournament Structure
      </h4>
      <ul className="space-y-1 text-sm text-white/80">
        {bullets.map((bullet, index) => (
          <li key={index} className="flex items-start">
            <span className="w-1 h-1 bg-gold-accent rounded-full mt-2 mr-2 flex-shrink-0" />
            {bullet}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function BuyInSettingsEditor({ settings, onUpdate, onBack, format, blindsStructure }) {
  // Initialize with proper schema and defaults
  const [localSettings, setLocalSettings] = useState({
    buyin: { amount: 0, rakePercent: 0, startingStack: 0 },
    late_registration: { enabled: true, until_level: null, until_minutes: null }, // ON by default
    re_entry: { max_entries_per_player: 0, closes_until_level: null, closes_after_minutes: null },
    rebuy: { price: 0, chips: 0, max_rebuys_per_player: 0, ends_until_level: null, ends_after_minutes: null },
    add_on: { price: 0, chips: 0, when: null },
    ...settings
  });

  // Get available levels for dropdowns
  const availableLevels = blindsStructure?.filter(level => !level.is_break) || [];
  const availableBreaks = blindsStructure?.filter(level => level.is_break) || [];

  const updateSection = (section, updates) => {
    const updated = { ...localSettings, [section]: { ...localSettings[section], ...updates } };
    setLocalSettings(updated);
  };

  // Mutually exclusive timing handlers
  const handleTimingChange = (section, field, value) => {
    const updates = { [field]: value };
    
    // Clear the other timing field
    if (field.includes('level')) {
      updates[field.replace('level', 'minutes').replace('until_', 'after_').replace('ends_', 'after_')] = null;
    } else if (field.includes('minutes')) {
      updates[field.replace('minutes', 'level').replace('after_', 'until_').replace('after_', 'ends_')] = null;
    }
    
    updateSection(section, updates);
  };

  const handleSave = () => {
    // Clean up settings and match new schema
    const cleanSettings = {};
    
    // Always include buy-in
    cleanSettings.buyin = {
      amount: localSettings.buyin.amount || 0,
      ...(localSettings.buyin.rakePercent && { rakePercent: localSettings.buyin.rakePercent }),
      ...(localSettings.buyin.startingStack && { startingStack: localSettings.buyin.startingStack })
    };

    // Late Registration (always available)
    cleanSettings.late_registration = {
      enabled: localSettings.late_registration.enabled,
      ...(localSettings.late_registration.until_level && { until_level: localSettings.late_registration.until_level }),
      ...(localSettings.late_registration.until_minutes && { until_minutes: localSettings.late_registration.until_minutes })
    };

    // Format-specific sections
    if (format === 'Re-entry') {
      cleanSettings.re_entry = {
        max_entries_per_player: localSettings.re_entry.max_entries_per_player || 0,
        ...(localSettings.re_entry.closes_until_level && { closes_until_level: localSettings.re_entry.closes_until_level }),
        ...(localSettings.re_entry.closes_after_minutes && { closes_after_minutes: localSettings.re_entry.closes_after_minutes })
      };
    }

    if (format === 'Re-buy') {
      cleanSettings.rebuy = {
        price: localSettings.rebuy.price || 0,
        chips: localSettings.rebuy.chips || 0,
        max_rebuys_per_player: localSettings.rebuy.max_rebuys_per_player || 0,
        ...(localSettings.rebuy.ends_until_level && { ends_until_level: localSettings.rebuy.ends_until_level }),
        ...(localSettings.rebuy.ends_after_minutes && { ends_after_minutes: localSettings.rebuy.ends_after_minutes })
      };

      cleanSettings.add_on = {
        price: localSettings.add_on.price || 0,
        chips: localSettings.add_on.chips || 0,
        ...(localSettings.add_on.when && { when: localSettings.add_on.when })
      };
    }

    onUpdate(cleanSettings);
    onBack();
  };

  const showReEntry = format === 'Re-entry';
  const showRebuy = format === 'Re-buy';

  return (
    <ModalBase
      isOpen={true}
      onClose={onBack}
      title="Buy-in Configuration"
      subtitle="Configure tournament entry and registration rules"
      priority={true}
      footerActions={
        <>
          <Button
            onClick={onBack}
            variant="neutral"
            className="btn-clay px-6 py-3 rounded-xl"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            className="btn-clay luxury-button px-6 py-3 rounded-xl flex items-center"
          >
            <Save className="w-5 h-5 mr-2" />
            Save Settings
          </Button>
        </>
      }
    >
      <div className="space-y-6 max-w-4xl mx-auto">
          {/* Buy-in Section */}
          <div className="glassmorphic-panel border border-white/10 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center">
                <DollarSign className="w-5 h-5 mr-2 text-gold-accent" />
                Buy-in
              </h3>
            </div>
            
            {/* Format constraints */}
            <div className="mb-4 p-3 bg-white/5 rounded-lg border border-white/10">
              <p className="text-sm text-white/70">{getFormatConstraints(format)}</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Amount ($) *</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={localSettings.buyin.amount || ''}
                  onChange={(e) => updateSection('buyin', { amount: parseFloat(e.target.value) || 0 })}
                  className="w-full glassmorphic-panel border border-white/30 rounded-xl px-4 py-3 text-white focus:border-gold-accent focus:ring-2 focus:ring-gold-accent/20"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Rake %</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={localSettings.buyin.rakePercent || ''}
                  onChange={(e) => updateSection('buyin', { rakePercent: parseFloat(e.target.value) || 0 })}
                  className="w-full glassmorphic-panel border border-white/30 rounded-xl px-4 py-3 text-white focus:border-gold-accent focus:ring-2 focus:ring-gold-accent/20"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Starting Stack</label>
                <input
                  type="number"
                  min="0"
                  value={localSettings.buyin.startingStack || ''}
                  onChange={(e) => updateSection('buyin', { startingStack: parseInt(e.target.value) || 0 })}
                  className="w-full glassmorphic-panel border border-white/30 rounded-xl px-4 py-3 text-white focus:border-gold-accent focus:ring-2 focus:ring-gold-accent/20"
                  placeholder="chips"
                />
              </div>
            </div>
          </div>

          {/* Late Registration Section - Always available */}
          <div className="glassmorphic-panel border border-white/10 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center">
                <Clock className="w-5 h-5 mr-2 text-deep-teal" />
                Late Registration
              </h3>
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={localSettings.late_registration.enabled}
                  onChange={(e) => updateSection('late_registration', { enabled: e.target.checked })}
                  className="w-4 h-4 text-gold-accent bg-transparent border-2 border-white/30 rounded focus:ring-gold-accent"
                />
              </label>
            </div>
            {localSettings.late_registration.enabled && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Until Level</label>
                    <select
                      value={localSettings.late_registration.until_level || ''}
                      onChange={(e) => handleTimingChange('late_registration', 'until_level', e.target.value ? parseInt(e.target.value) : null)}
                      className="w-full glassmorphic-panel border border-white/30 rounded-xl px-4 py-3 text-white focus:border-gold-accent focus:ring-2 focus:ring-gold-accent/20"
                    >
                      <option value="">Select level...</option>
                      {availableLevels.map((level, index) => (
                        <option key={level.id} value={index + 1}>
                          Level {index + 1} ({level.small_blind}/{level.big_blind})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Or Minutes After Start</label>
                    <input
                      type="number"
                      min="0"
                      value={localSettings.late_registration.until_minutes || ''}
                      onChange={(e) => handleTimingChange('late_registration', 'until_minutes', parseInt(e.target.value) || null)}
                      className={`w-full glassmorphic-panel border border-white/30 rounded-xl px-4 py-3 text-white focus:border-gold-accent focus:ring-2 focus:ring-gold-accent/20 ${
                        localSettings.late_registration.until_level ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                      placeholder="minutes"
                      disabled={!!localSettings.late_registration.until_level}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Re-entry Section - Parameters only (no toggle) */}
          {showReEntry && (
            <div className="glassmorphic-panel border border-white/10 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <Users className="w-5 h-5 mr-2 text-deep-teal" />
                Re-entry Parameters
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Max Entries Per Player</label>
                  <input
                    type="number"
                    min="0"
                    value={localSettings.re_entry.max_entries_per_player || ''}
                    onChange={(e) => updateSection('re_entry', { max_entries_per_player: parseInt(e.target.value) || 0 })}
                    className="w-full glassmorphic-panel border border-white/30 rounded-xl px-4 py-3 text-white focus:border-gold-accent focus:ring-2 focus:ring-gold-accent/20"
                    placeholder="0 = unlimited"
                  />
                  <p className="text-xs text-gray-400 mt-1">0 means unlimited re-entries</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Closes Until Level</label>
                    <select
                      value={localSettings.re_entry.closes_until_level || ''}
                      onChange={(e) => handleTimingChange('re_entry', 'closes_until_level', e.target.value ? parseInt(e.target.value) : null)}
                      className="w-full glassmorphic-panel border border-white/30 rounded-xl px-4 py-3 text-white focus:border-gold-accent focus:ring-2 focus:ring-gold-accent/20"
                    >
                      <option value="">Select level...</option>
                      {availableLevels.map((level, index) => (
                        <option key={level.id} value={index + 1}>
                          Level {index + 1} ({level.small_blind}/{level.big_blind})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Or Minutes After Start</label>
                    <input
                      type="number"
                      min="0"
                      value={localSettings.re_entry.closes_after_minutes || ''}
                      onChange={(e) => handleTimingChange('re_entry', 'closes_after_minutes', parseInt(e.target.value) || null)}
                      className={`w-full glassmorphic-panel border border-white/30 rounded-xl px-4 py-3 text-white focus:border-gold-accent focus:ring-2 focus:ring-gold-accent/20 ${
                        localSettings.re_entry.closes_until_level ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                      placeholder="minutes"
                      disabled={!!localSettings.re_entry.closes_until_level}
                    />
                  </div>
                </div>
                {localSettings.late_registration.enabled && (
                  <p className="text-xs text-gray-400">
                    Note: If left empty, re-entry will close when Late Registration ends.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Rebuy Section - Parameters only (no toggle) */}
          {showRebuy && (
            <>
              <div className="glassmorphic-panel border border-white/10 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <DollarSign className="w-5 h-5 mr-2 text-ips-red" />
                  Rebuy Parameters
                </h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Price ($)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={localSettings.rebuy.price || ''}
                        onChange={(e) => updateSection('rebuy', { price: parseFloat(e.target.value) || 0 })}
                        className="w-full glassmorphic-panel border border-white/30 rounded-xl px-4 py-3 text-white focus:border-gold-accent focus:ring-2 focus:ring-gold-accent/20"
                        placeholder={`Default: ${localSettings.buyin.amount || 0}`}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Chips</label>
                      <input
                        type="number"
                        min="0"
                        value={localSettings.rebuy.chips || ''}
                        onChange={(e) => updateSection('rebuy', { chips: parseInt(e.target.value) || 0 })}
                        className="w-full glassmorphic-panel border border-white/30 rounded-xl px-4 py-3 text-white focus:border-gold-accent focus:ring-2 focus:ring-gold-accent/20"
                        placeholder={`Default: ${localSettings.buyin.startingStack || 0}`}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Max Per Player</label>
                      <input
                        type="number"
                        min="0"
                        value={localSettings.rebuy.max_rebuys_per_player || ''}
                        onChange={(e) => updateSection('rebuy', { max_rebuys_per_player: parseInt(e.target.value) || 0 })}
                        className="w-full glassmorphic-panel border border-white/30 rounded-xl px-4 py-3 text-white focus:border-gold-accent focus:ring-2 focus:ring-gold-accent/20"
                        placeholder="0 = unlimited"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Ends Until Level</label>
                      <select
                        value={localSettings.rebuy.ends_until_level || ''}
                        onChange={(e) => handleTimingChange('rebuy', 'ends_until_level', e.target.value ? parseInt(e.target.value) : null)}
                        className="w-full glassmorphic-panel border border-white/30 rounded-xl px-4 py-3 text-white focus:border-gold-accent focus:ring-2 focus:ring-gold-accent/20"
                      >
                        <option value="">Select level...</option>
                        {availableLevels.map((level, index) => (
                          <option key={level.id} value={index + 1}>
                            Level {index + 1} ({level.small_blind}/{level.big_blind})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Or Minutes After Start</label>
                      <input
                        type="number"
                        min="0"
                        value={localSettings.rebuy.ends_after_minutes || ''}
                        onChange={(e) => handleTimingChange('rebuy', 'ends_after_minutes', parseInt(e.target.value) || null)}
                        className={`w-full glassmorphic-panel border border-white/30 rounded-xl px-4 py-3 text-white focus:border-gold-accent focus:ring-2 focus:ring-gold-accent/20 ${
                          localSettings.rebuy.ends_until_level ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                        placeholder="minutes"
                        disabled={!!localSettings.rebuy.ends_until_level}
                      />
                    </div>
                  </div>
                  <p className="text-xs text-gray-400">
                    Note: Rebuy window should not exceed Late Registration period.
                  </p>
                </div>
              </div>

              <div className="glassmorphic-panel border border-white/10 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <Coffee className="w-5 h-5 mr-2 text-gold-accent" />
                  Add-on Parameters
                </h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Price ($)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={localSettings.add_on.price || ''}
                        onChange={(e) => updateSection('add_on', { price: parseFloat(e.target.value) || 0 })}
                        className="w-full glassmorphic-panel border border-white/30 rounded-xl px-4 py-3 text-white focus:border-gold-accent focus:ring-2 focus:ring-gold-accent/20"
                        placeholder={`Default: ${localSettings.buyin.amount || 0}`}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Chips</label>
                      <input
                        type="number"
                        min="0"
                        value={localSettings.add_on.chips || ''}
                        onChange={(e) => updateSection('add_on', { chips: parseInt(e.target.value) || 0 })}
                        className="w-full glassmorphic-panel border border-white/30 rounded-xl px-4 py-3 text-white focus:border-gold-accent focus:ring-2 focus:ring-gold-accent/20"
                        placeholder={`Default: ${localSettings.buyin.startingStack || 0}`}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">When</label>
                      <select
                        value={localSettings.add_on.when || ''}
                        onChange={(e) => updateSection('add_on', { when: e.target.value || null })}
                        className="w-full glassmorphic-panel border border-white/30 rounded-xl px-4 py-3 text-white focus:border-gold-accent focus:ring-2 focus:ring-gold-accent/20"
                      >
                        <option value="">Select timing...</option>
                        {availableBreaks.map((breakLevel, index) => (
                          <option key={breakLevel.id} value={`break #${index + 1}`}>
                            At Break #{index + 1}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400">
                    Note: One add-on per player maximum.
                  </p>
                </div>
              </div>
            </>
          )}

        {/* Bottom Summary */}
        <BuyInSummary settings={localSettings} format={format} />
      </div>
    </ModalBase>
  );
}