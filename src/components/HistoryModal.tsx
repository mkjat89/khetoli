import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { sounds } from '../services/sound';
import { GameType } from '../types';
import { History as HistoryIcon, Clock, Filter, X } from 'lucide-react';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({ isOpen, onClose }) => {
  const { history } = useGame();
  const [selectedFilter, setSelectedFilter] = useState<'all' | GameType>('all');

  if (!isOpen) return null;

  const filteredHistory = history.filter((item) => {
    if (selectedFilter === 'all') return true;
    return item.game === selectedFilter;
  });

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto">
      <div className="glass-panel max-w-2xl w-full rounded-2xl border border-slate-800 p-6 space-y-5 shadow-2xl relative animate-in zoom-in-95 duration-200 my-8">
        <button
          onClick={() => {
            sounds.playClick();
            onClose();
          }}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
          <div className="w-11 h-11 rounded-xl bg-cyan-500/20 border border-cyan-500/50 flex items-center justify-center text-cyan-400">
            <HistoryIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl font-black text-white font-display">Betting Ledger</h3>
            <p className="text-xs text-slate-400">Comprehensive simulated round outcomes and multiplier telemetry</p>
          </div>
        </div>

        {/* Filter controls */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-1">
          {[
            { id: 'all', label: 'All Games' },
            { id: 'aviator', label: 'Aviator' },
            { id: 'roulette', label: 'Roulette' },
            { id: 'dice', label: 'Dice' },
            { id: 'blackjack', label: 'Blackjack' },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => {
                sounds.playClick();
                setSelectedFilter(f.id as typeof selectedFilter);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
                selectedFilter === f.id
                  ? 'bg-cyan-500 text-slate-950 shadow'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="max-h-[380px] overflow-y-auto border border-slate-800/80 rounded-xl bg-slate-950/60">
          {filteredHistory.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500">
              No betting records logged yet. Play any game to see history.
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/90 text-slate-400 font-semibold border-b border-slate-800 sticky top-0 backdrop-blur-sm">
                <tr>
                  <th className="py-2.5 px-3">Time</th>
                  <th className="py-2.5 px-3">Game</th>
                  <th className="py-2.5 px-3">Wager</th>
                  <th className="py-2.5 px-3">Multiplier</th>
                  <th className="py-2.5 px-3">Payout</th>
                  <th className="py-2.5 px-3">Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredHistory.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-2.5 px-3 font-mono text-[11px] text-slate-400">
                      {formatTime(item.timestamp)}
                    </td>
                    <td className="py-2.5 px-3 font-medium text-slate-200">
                      {item.gameTitle}
                    </td>
                    <td className="py-2.5 px-3 font-tabular text-slate-300">
                      {item.betAmount.toLocaleString()} SC
                    </td>
                    <td className="py-2.5 px-3 font-tabular font-bold">
                      {item.multiplier > 0 ? (
                        <span className="text-amber-400">{item.multiplier.toFixed(2)}x</span>
                      ) : (
                        <span className="text-slate-500">0.00x</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 font-tabular font-bold">
                      {item.won ? (
                        <span className="text-emerald-400">+{item.payout.toLocaleString()} SC</span>
                      ) : (
                        <span className="text-rose-400/80">0 SC</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-slate-400 truncate max-w-[140px]">
                      {item.resultText}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
