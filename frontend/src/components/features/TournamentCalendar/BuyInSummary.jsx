// src/components/features/TournamentCalendar/BuyInSummary.jsx

import React from 'react';
import { DollarSign, RefreshCw, Plus, Clock } from 'lucide-react';

export function BuyInSummary({ buyInSettings, tournamentType, buyInCost }) {
  // If no specific buy-in settings, show basic cost info
  if (!buyInSettings || Object.keys(buyInSettings).length === 0) {
    return (
      <div className="glassmorphic-panel border border-white/30 rounded-xl p-6">
        <h3 className="text-lg font-heading text-white mb-4 flex items-center">
          <DollarSign className="w-5 h-5 mr-2 text-gold-accent" />
          Вступительный взнос
        </h3>
        
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-300">Основной взнос:</span>
            <span className="text-gold-accent font-bold text-lg">
              ${buyInCost || 0}
            </span>
          </div>
          
          <div className="text-sm text-gray-400">
            {tournamentType === 'Freezeout' && 'Турнир на выбывание - без возможности докупки'}
            {tournamentType === 'Re-buy' && 'Возможны докупки в течение турнира'}
            {tournamentType === 'Re-entry' && 'Возможен повторный вход до окончания регистрации'}
          </div>
        </div>
      </div>
    );
  }

  // Render detailed buy-in information when settings are available
  const {
    rebuy_cost,
    rebuy_period,
    rebuy_limit,
    addon_cost,
    addon_period,
    reentry_cost,
    reentry_period,
    late_registration_fee
  } = buyInSettings;

  return (
    <div className="glassmorphic-panel border border-white/30 rounded-xl p-6">
      <h3 className="text-lg font-heading text-white mb-4 flex items-center">
        <DollarSign className="w-5 h-5 mr-2 text-gold-accent" />
        Структура взносов
      </h3>
      
      <div className="space-y-4">
        {/* Main Buy-in */}
        <div className="flex justify-between items-center py-2 border-b border-white/20">
          <span className="text-gray-300">Основной взнос:</span>
          <span className="text-gold-accent font-bold text-lg">
            ${buyInCost || 0}
          </span>
        </div>

        {/* Re-buy information */}
        {(tournamentType === 'Re-buy' || rebuy_cost) && (
          <div className="bg-blue-500/10 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <RefreshCw className="w-4 h-4 mr-2 text-blue-400" />
              <span className="text-blue-400 font-medium">Докупки (Re-buy)</span>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-300">Стоимость докупки:</span>
                <span className="text-white">${rebuy_cost || buyInCost || 0}</span>
              </div>
              {rebuy_period && (
                <div className="flex justify-between">
                  <span className="text-gray-300">Период докупок:</span>
                  <span className="text-white">{rebuy_period} минут</span>
                </div>
              )}
              {rebuy_limit && (
                <div className="flex justify-between">
                  <span className="text-gray-300">Лимит докупок:</span>
                  <span className="text-white">{rebuy_limit}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Re-entry information */}
        {(tournamentType === 'Re-entry' || reentry_cost) && (
          <div className="bg-green-500/10 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <Plus className="w-4 h-4 mr-2 text-green-400" />
              <span className="text-green-400 font-medium">Повторный вход</span>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-300">Стоимость повторного входа:</span>
                <span className="text-white">${reentry_cost || buyInCost || 0}</span>
              </div>
              {reentry_period && (
                <div className="flex justify-between">
                  <span className="text-gray-300">Период повторного входа:</span>
                  <span className="text-white">{reentry_period} минут</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Add-on information */}
        {addon_cost && (
          <div className="bg-purple-500/10 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <Plus className="w-4 h-4 mr-2 text-purple-400" />
              <span className="text-purple-400 font-medium">Дополнительные фишки</span>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-300">Стоимость:</span>
                <span className="text-white">${addon_cost}</span>
              </div>
              {addon_period && (
                <div className="flex justify-between">
                  <span className="text-gray-300">Доступно в течение:</span>
                  <span className="text-white">{addon_period} минут</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Late registration fee */}
        {late_registration_fee && (
          <div className="bg-orange-500/10 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <Clock className="w-4 h-4 mr-2 text-orange-400" />
              <span className="text-orange-400 font-medium">Поздняя регистрация</span>
            </div>
            <div className="text-sm">
              <div className="flex justify-between">
                <span className="text-gray-300">Дополнительный сбор:</span>
                <span className="text-white">${late_registration_fee}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}