import React from 'react';
import { useGame } from '../context/GameContext';
import { sounds } from '../services/sound';
import { Trophy, CheckCircle, Sparkles, X, Award } from 'lucide-react';

interface AchievementsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AchievementsModal: React.FC<AchievementsModalProps> = ({ isOpen, onClose }) => {
  const { achievements } = useGame();

  if (!isOpen) return null;

  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto">
      <div className="glass-panel max-w-xl w-full rounded-2xl border border-amber-500/30 p-6 space-y-5 shadow-2xl relative animate-in zoom-in-95 duration-200 my-8">
        <button
          onClick={() => {
            sounds.playClick();
            onClose();
          }}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-amber-400 glow-gold">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-black text-white font-display">Trophy Case</h3>
              <p className="text-xs text-slate-400">Unlock milestones across all 4 games to earn bonus SkyCoins</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-400">Unlocked:</span>
            <div className="text-base font-bold text-amber-400 font-tabular">
              {unlockedCount} / {achievements.length}
            </div>
          </div>
        </div>

        {/* Achievements List */}
        <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
          {achievements.map((item) => (
            <div
              key={item.id}
              className={`p-3.5 rounded-xl border flex items-center justify-between gap-4 transition-all ${
                item.unlocked
                  ? 'bg-amber-950/20 border-amber-500/40'
                  : 'bg-slate-900/60 border-slate-800 opacity-80'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                    item.unlocked
                      ? 'bg-amber-500/30 text-amber-300 border-amber-400'
                      : 'bg-slate-800 text-slate-500 border-slate-700'
                  }`}
                >
                  <Award className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-white truncate">{item.title}</span>
                    {item.unlocked && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
                        Completed
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 line-clamp-1">{item.description}</p>
                </div>
              </div>

              <div className="text-right shrink-0">
                <div className="font-tabular font-bold text-xs text-amber-400">
                  +{item.reward.toLocaleString()} SC
                </div>
                <div className="text-[10px] text-slate-500">
                  {item.unlocked ? 'Claimed' : `${item.progress} / ${item.maxProgress}`}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
