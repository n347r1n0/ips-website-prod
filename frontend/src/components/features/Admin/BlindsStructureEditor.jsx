// src/components/features/Admin/BlindsStructureEditor.jsx

import React, { useState } from 'react';
import { ArrowLeft, Plus, Trash2, Coffee, Clock } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function BlindsStructureEditor({ structure, onUpdate, onBack }) {
  const [levels, setLevels] = useState(structure || []);

  const addLevel = () => {
    const newLevel = {
      id: Date.now(),
      duration: 20,
      small_blind: 25,
      big_blind: 50,
      ante: 0,
      is_break: false
    };
    const updatedLevels = [...levels, newLevel];
    setLevels(updatedLevels);
    onUpdate(updatedLevels);
  };

  const addBreak = () => {
    const newBreak = {
      id: Date.now(),
      duration: 15,
      small_blind: 0,
      big_blind: 0,
      ante: 0,
      is_break: true
    };
    const updatedLevels = [...levels, newBreak];
    setLevels(updatedLevels);
    onUpdate(updatedLevels);
  };

  const updateLevel = (index, field, value) => {
    const updatedLevels = [...levels];
    updatedLevels[index] = {
      ...updatedLevels[index],
      [field]: field === 'is_break' ? value : (isNaN(value) ? 0 : parseInt(value) || 0)
    };
    setLevels(updatedLevels);
    onUpdate(updatedLevels);
  };

  const removeLevel = (index) => {
    const updatedLevels = levels.filter((_, i) => i !== index);
    setLevels(updatedLevels);
    onUpdate(updatedLevels);
  };

  const moveLevel = (index, direction) => {
    if ((direction === -1 && index === 0) || (direction === 1 && index === levels.length - 1)) {
      return;
    }
    
    const updatedLevels = [...levels];
    const [movedLevel] = updatedLevels.splice(index, 1);
    updatedLevels.splice(index + direction, 0, movedLevel);
    setLevels(updatedLevels);
    onUpdate(updatedLevels);
  };

  return (
    <div className="w-full max-h-[80vh] overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Button
            onClick={onBack}
            className="btn-glass p-2 rounded-xl mr-4 text-white border-white/30 hover:bg-white/10"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h2 className="text-2xl font-heading text-white">Blinds Structure Editor</h2>
        </div>
        <div className="flex space-x-2">
          <Button
            onClick={addLevel}
            className="btn-glass px-4 py-2 rounded-xl flex items-center text-white border-white/30 hover:bg-white/10"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Level
          </Button>
          <Button
            onClick={addBreak}
            className="btn-glass px-4 py-2 rounded-xl flex items-center text-white border-white/30 hover:bg-white/10"
          >
            <Coffee className="w-4 h-4 mr-2" />
            Add Break
          </Button>
        </div>
      </div>

      {levels.length === 0 ? (
        <div className="glassmorphic-panel border border-white/30 rounded-xl p-8 text-center">
          <p className="text-gray-400 mb-4">No levels configured</p>
          <p className="text-gray-500 text-sm">Add your first level or break to get started</p>
        </div>
      ) : (
        <div className="space-y-4">
          {levels.map((level, index) => (
            <div
              key={level.id || index}
              className={`glassmorphic-panel border rounded-xl p-4 ${
                level.is_break 
                  ? 'border-blue-500/50 bg-blue-500/10' 
                  : 'border-white/30'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  {level.is_break ? (
                    <Coffee className="w-5 h-5 text-blue-400" />
                  ) : (
                    <Clock className="w-5 h-5 text-gold-accent" />
                  )}
                  <span className="text-white font-medium">
                    {level.is_break ? `Break ${Math.floor(index / 2) + 1}` : `Level ${index + 1}`}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => moveLevel(index, -1)}
                    disabled={index === 0}
                    className="text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Move up"
                  >
                    ↑
                  </button>
                  <button
                    onClick={() => moveLevel(index, 1)}
                    disabled={index === levels.length - 1}
                    className="text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Move down"
                  >
                    ↓
                  </button>
                  <Button
                    onClick={() => removeLevel(index)}
                    className="btn-glass p-2 rounded-lg text-red-300 border-red-500/30 hover:bg-red-500/20"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Duration (min)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={level.duration || ''}
                    onChange={(e) => updateLevel(index, 'duration', e.target.value)}
                    className="w-full glassmorphic-panel border border-white/30 rounded-xl px-3 py-2 text-white placeholder-gray-400 focus:border-gold-accent focus:ring-2 focus:ring-gold-accent/20 focus:outline-none"
                    placeholder="20"
                  />
                </div>

                {!level.is_break && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Small Blind
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={level.small_blind || ''}
                        onChange={(e) => updateLevel(index, 'small_blind', e.target.value)}
                        className="w-full glassmorphic-panel border border-white/30 rounded-xl px-3 py-2 text-white placeholder-gray-400 focus:border-gold-accent focus:ring-2 focus:ring-gold-accent/20 focus:outline-none"
                        placeholder="25"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Big Blind
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={level.big_blind || ''}
                        onChange={(e) => updateLevel(index, 'big_blind', e.target.value)}
                        className="w-full glassmorphic-panel border border-white/30 rounded-xl px-3 py-2 text-white placeholder-gray-400 focus:border-gold-accent focus:ring-2 focus:ring-gold-accent/20 focus:outline-none"
                        placeholder="50"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Ante
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={level.ante || ''}
                        onChange={(e) => updateLevel(index, 'ante', e.target.value)}
                        className="w-full glassmorphic-panel border border-white/30 rounded-xl px-3 py-2 text-white placeholder-gray-400 focus:border-gold-accent focus:ring-2 focus:ring-gold-accent/20 focus:outline-none"
                        placeholder="0"
                      />
                    </div>
                  </>
                )}

                <div className="flex items-end">
                  <label className="flex items-center space-x-2 text-gray-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={level.is_break}
                      onChange={(e) => updateLevel(index, 'is_break', e.target.checked)}
                      className="w-4 h-4 text-gold-accent bg-transparent border-2 border-white/30 rounded focus:ring-gold-accent focus:ring-2"
                    />
                    <span className="text-sm">Break</span>
                  </label>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 flex justify-between items-center">
        <div className="text-gray-300 text-sm">
          Total levels: {levels.filter(l => !l.is_break).length} • 
          Total breaks: {levels.filter(l => l.is_break).length} • 
          Estimated time: {Math.round(levels.reduce((sum, l) => sum + (l.duration || 0), 0) / 60 * 10) / 10}h
        </div>
        <Button
          onClick={onBack}
          className="luxury-button px-6 py-3 rounded-xl flex items-center"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Done
        </Button>
      </div>
    </div>
  );
}
