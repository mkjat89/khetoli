import React from 'react';
import { sounds } from '../services/sound';
import { ShieldCheck, AlertTriangle, Coins, Lock, CheckCircle2, X } from 'lucide-react';

interface ResponsibleGamingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ResponsibleGamingModal: React.FC<ResponsibleGamingModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto">
      <div className="glass-panel max-w-lg w-full rounded-2xl border border-emerald-500/40 p-6 space-y-5 shadow-2xl relative animate-in zoom-in-95 duration-200 my-8">
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
          <div className="w-11 h-11 rounded-xl bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-emerald-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-black text-white font-display">Simulated Social Gaming Pledge</h3>
            <p className="text-xs text-slate-400">Transparency, fair play, and zero-financial-risk standards</p>
          </div>
        </div>

        <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-start gap-3">
            <Coins className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-white block mb-0.5">Virtual Currency Exclusively:</strong>
              SkyCoins (SC) have absolutely zero real-world monetary value. They cannot be purchased with real fiat or cryptocurrency, nor can they ever be redeemed or withdrawn for real money, goods, or prizes.
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-start gap-3">
            <Lock className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-white block mb-0.5">No Deposits or Payment Processing:</strong>
              SkyPlay Casino has no banking portals, credit card inputs, or crypto gateways. Free coin replenishments and daily bonuses are provided indefinitely at no cost.
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-white block mb-0.5">Simulated Entertainment Labeling:</strong>
              All game results, multiplier curves, and co-player activities in Aviator and Roulette are generated in client-side simulation purely for visual entertainment and engagement.
            </div>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={() => {
              sounds.playClick();
              onClose();
            }}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg transition-colors"
          >
            I Understand & Agree
          </button>
        </div>
      </div>
    </div>
  );
};
