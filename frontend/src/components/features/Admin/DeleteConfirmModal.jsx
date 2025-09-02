import React from 'react';
import { Trash2, X, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function DeleteConfirmModal({ isOpen, onClose, onConfirm, tournamentName, loading }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative glassmorphic-panel rounded-2xl p-8 w-full max-w-md">
        <div className="flex items-center mb-6">
          <div className="bg-red-500/20 p-3 rounded-full mr-4">
            <AlertTriangle className="w-6 h-6 text-red-400" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">Delete Tournament</h2>
            <p className="text-gray-300 text-sm">This action cannot be undone</p>
          </div>
        </div>

        <div className="mb-6">
          <p className="text-gray-300 mb-2">
            Are you sure you want to delete the tournament:
          </p>
          <div className="glassmorphic-panel rounded-xl p-4 border border-white/20">
            <p className="text-white font-semibold">{tournamentName}</p>
          </div>
        </div>

        <div className="flex space-x-4">
          <Button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 bg-red-500/80 hover:bg-red-500 text-white px-6 py-3 rounded-xl flex items-center justify-center transition-colors"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current" />
            ) : (
              <>
                <Trash2 className="w-5 h-5 mr-2" />
                Delete Tournament
              </>
            )}
          </Button>
          <Button
            onClick={onClose}
            disabled={loading}
            className="glassmorphic-panel border-white/30 text-white hover:bg-white/10 px-6 py-3 rounded-xl"
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}