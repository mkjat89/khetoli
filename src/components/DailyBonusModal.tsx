import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { sounds } from '../services/sound';
import { Gift, Clock, Sparkles, Trophy, X, Zap } from 'lucide-react';

interface DailyBonusModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DailyBonusModal: React.FC<DailyBonusModalProps> = ({ isOpen, onClose }) => {
  const { canClaimDaily, timeUntilNextDaily, claimDailyBonus, currentTier, refillBalance } = useGame();
  const [claimMessage, setClaimMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleClaim = () => {
    const res = claimDailyBonus();
    setClaimMessage(res.message);
  };

  const handleInstantDemoRefill = () => {
    refillBalance(5000);
    setClaimMessage('Instant Demo Bonus: 5,000 Free SkyCoins added to your balance!');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="glass-panel max-w-md w-full rounded-2xl border border-amber-500/40 p-6 space-y-5 shadow-2xl relative animate-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          onClick={() => {
            sounds.playClick();
            onClose();
          }}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-amber-400 glow-gold">
            <Gift className="w-6 h-6 animate-bounce" />
          </div>
          <div>
            <h3 className="text-xl font-black text-white font-display">Daily Free SkyCoins</h3>
            <p className="text-xs text-slate-400">Claim your complimentary daily gaming replenishment</p>
          </div>
        </div>

        {/* Tier Boost Box */}
        <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between text-xs">
          <div>
            <div className="text-slate-400">Current VIP Tier:</div>
            <div className="font-bold text-sm text-white" style={{ color: currentTier.color }}>
              {currentTier.tier} VIP Club
            </div>
          </div>
          <div className="text-right">
            <div className="text-slate-400">Tier Multiplier:</div>
            <div className="font-bold text-amber-400 text-sm font-tabular">
              {currentTier.bonusMultiplier}x Boost
            </div>
          </div>
        </div>

        {/* Message notification */}
        {claimMessage && (
          <div className="p-3 rounded-xl bg-emerald-950/70 border border-emerald-500/60 text-emerald-300 text-xs font-semibold text-center animate-in fade-in">
            {claimMessage}
          </div>
        )}

        {/* Claim Status & Action */}
        <div className="text-center space-y-3 py-2">
          {canClaimDaily ? (
            <button
              onClick={handleClaim}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-black text-lg shadow-xl glow-gold active:scale-98 transition-all flex items-center justify-center gap-2"
            >
              <Sparkles className="w-5 h-5" />
              <span>CLAIM {Math.round(2500 * currentTier.bonusMultiplier).toLocaleString()} SC NOW</span>
            </button>
          ) : (
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 text-sm font-tabular">
                <Clock className="w-4 h-4 text-cyan-400" />
                <span>Next Daily Claim in: <strong className="text-cyan-300">{timeUntilNextDaily}</strong></span>
              </div>
              <p className="text-xs text-slate-400">
                You have claimed your daily reward today. Want more demo coins immediately? Use the instant demo faucet below:
              </p>
              <button
                onClick={handleInstantDemoRefill}
                className="w-full py-3 rounded-xl bg-cyan-600/30 hover:bg-cyan-600/50 border border-cyan-500 text-cyan-300 font-bold text-sm transition-all flex items-center justify-center gap-2"
              >
                <Zap className="w-4 h-4" />
                <span>Instant Demo Faucet (+5,000 SC)</span>
              </button>
            </div>
          )}
        </div>

        <div className="text-[11px] text-slate-500 text-center border-t border-slate-800 pt-3">
          SkyCoins are virtual tokens strictly for entertainment. No real monetary transactions or withdrawals.
        </div>
      </div>
    </div>
  );
};
