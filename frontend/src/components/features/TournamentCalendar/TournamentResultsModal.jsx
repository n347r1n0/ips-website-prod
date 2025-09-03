import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { participantsAPI } from '@/lib/participantsAPI';
import { Button } from '@/components/ui/Button';

export function TournamentResultsModal({ tournament, onClose }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    if (!tournament?.id) return;
    (async () => {
      try {
        const data = await participantsAPI.getResultsByTournament(tournament.id);
        if (!cancelled) setRows(data);
      } catch (e) {
        console.error('Failed to load results:', e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [tournament.id]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, y: 20, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.9, y: 20, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 26 }}
          className="relative w-full max-w-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="glassmorphic-panel rounded-2xl p-8 text-white">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors z-10"
            >
              <X className="w-6 h-6" />
            </button>

            <h2 className="text-2xl font-heading text-white mb-2">
              Результаты: {tournament.name}
            </h2>
            <div className="h-px bg-gradient-to-r from-transparent via-gold-accent to-transparent mb-6" />

            {loading ? (
              <div className="text-gray-400">Загрузка…</div>
            ) : rows.length === 0 ? (
              <div className="text-gray-400">Данных о результатах пока нет.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm results-table">
                  <thead className="text-left text-gray-400 border-b border-white/10">
                    <tr>
                      <th className="py-2 pr-4">Место</th>
                      <th className="py-2 pr-4">Игрок</th>
                      <th className="py-2 pr-4">Очки</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => (
                      <tr key={r.id} className="border-b border-white/5">
                        <td className="py-2 pr-4">{r.place}</td>
                        <td className="py-2 pr-4">{r.name}</td>
                        <td className="py-2 pr-4">{r.points}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="mt-6 text-right">
              <Button onClick={onClose} className="glassmorphic-panel border-white/30 text-white hover:bg-white/10 px-6 py-2 rounded-xl">
                Закрыть
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
