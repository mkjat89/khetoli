import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { sounds } from '../services/sound';
import { Coins, PlusCircle, Sparkles, X, Check } from 'lucide-react';

interface RefillModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RefillModal: React.FC<RefillModalProps> = ({ isOpen, onClose }) => {
  const { refillBalance, balance } = useGame();
  const [successAmt, setSuccessAmt] = useState<number | null>(null);

  if (!isOpen) return null;

  const handleRefill = (amount: number) => {
    refillBalance(amount);
    setSuccessAmt(amount);
    setTimeout(() => {
      setSuccessAmt(null);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="glass-panel max-w-md w-full rounded-2xl border border-cyan-500/40 p-6 space-y-5 shadow-2xl relative animate-in zoom-in-95 duration-200">
        <button
          onClick={() => {
            sounds.playClick();
            onClose();
          }}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/20 border border-cyan-500/50 flex items-center justify-center text-cyan-400 glow-blue">
            <Coins className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h3 className="text-xl font-black text-white font-display">Refill SkyCoins</h3>
            <p className="text-xs text-slate-400">
              Current balance: <strong className="text-amber-400 font-tabular">{balance.toLocaleString()} SC</strong>
            </p>
          </div>
        </div>

        {successAmt && (
          <div className="p-3 rounded-xl bg-emerald-950/70 border border-emerald-500/60 text-emerald-300 text-xs font-semibold text-center flex items-center justify-center gap-2">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>Successfully added +{successAmt.toLocaleString()} SkyCoins!</span>
          </div>
        )}

        <div className="space-y-2.5">
          <span className="text-xs text-slate-300 font-semibold">Select replenishment bundle (100% Free):</span>
          {[
            { amount: 5000, label: 'Casual Starter Pack', badge: 'Standard' },
            { amount: 25000, label: 'High Roller VIP Bundle', badge: 'Popular' },
            { amount: 100000, label: 'Cosmic Whale Vault', badge: 'Maximum' },
          ].map((pack) => (
            <button
              key={pack.amount}
              type="button"
              onClick={() => handleRefill(pack.amount)}
              className="w-full p-3.5 rounded-xl bg-slate-900/80 hover:bg-slate-800/90 border border-slate-700 hover:border-cyan-400/60 flex items-center justify-between text-left transition-all group"
            >
              <div>
                <div className="font-bold text-white text-sm group-hover:text-cyan-300">
                  +{pack.amount.toLocaleString()} SkyCoins
                </div>
                <div className="text-xs text-slate-400">{pack.label}</div>
              </div>
              <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-800">
                {pack.badge}
              </span>
            </button>
          ))}
        </div>

        <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px] text-slate-400 leading-relaxed">
          <strong className="text-slate-200">Entertainment Notice:</strong> SkyCoins have no monetary value and cannot be exchanged for cash, cryptos, or real prizes. Refills are always 100% free with unlimited availability.
        </div>
      </div>
    </div>
  );
};
