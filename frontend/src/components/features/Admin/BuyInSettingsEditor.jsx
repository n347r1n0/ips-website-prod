// src/components/features/Admin/BuyInSettingsEditor.jsx

import React from 'react';
import { ArrowLeft, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function BuyInSettingsEditor({ settings, onUpdate, onBack }) {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Button
            onClick={onBack}
            className="glassmorphic-panel border-white/30 text-white hover:bg-white/10 p-2 rounded-xl mr-4"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h2 className="text-2xl font-heading text-white flex items-center">
            <DollarSign className="w-6 h-6 mr-2 text-gold-accent" />
            Buy-in and Re-entry Settings
          </h2>
        </div>
      </div>

      <div className="glassmorphic-panel border border-white/30 rounded-xl p-8 text-center">
        <div className="mb-6">
          <DollarSign className="w-16 h-16 mx-auto text-gold-accent mb-4" />
          <h3 className="text-xl font-heading text-white mb-2">Coming Soon</h3>
          <p className="text-gray-400">
            The buy-in and re-entry configuration interface will be implemented in the next phase.
          </p>
        </div>
        
        <div className="text-left max-w-md mx-auto space-y-2 text-sm text-gray-500">
          <p>• Configure re-buy periods and limits</p>
          <p>• Set re-entry rules and timing</p>
          <p>• Define add-on structures</p>
          <p>• Manage late registration periods</p>
        </div>
      </div>

      <div className="mt-8 flex justify-end">
        <Button
          onClick={onBack}
          className="luxury-button px-6 py-3 rounded-xl flex items-center"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back
        </Button>
      </div>
    </div>
  );
}