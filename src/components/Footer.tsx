import React from 'react';
import { GameType } from '../types';
import { sounds } from '../services/sound';
import { Plane, ShieldCheck, HeartHandshake, Info } from 'lucide-react';

interface FooterProps {
  onSelectGame: (game: GameType) => void;
  onOpenFairPledge: () => void;
  onOpenDailyBonus: () => void;
  onOpenRefill: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onSelectGame,
  onOpenFairPledge,
  onOpenDailyBonus,
  onOpenRefill,
}) => {
  return (
    <footer className="border-t border-slate-900 bg-slate-950/90 text-slate-400 py-12 px-4 sm:px-6 mt-16">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Col 1: Brand & Notice */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center">
                <Plane className="w-4 h-4 text-white -rotate-45" />
              </div>
              <span className="font-display font-black text-lg text-white">
                SkyPlay Casino<span className="text-amber-400">.</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 max-w-md leading-relaxed">
              SkyPlay is a premier virtual-coin social gaming platform created exclusively for simulated leisure and strategy entertainment. All balances, multipliers, and rounds are client-side simulations. No real money betting or purchases are supported.
            </p>
          </div>

          {/* Col 2: Games Quick Links */}
          <div className="space-y-2 text-xs">
            <span className="font-bold text-slate-200 uppercase tracking-wider block">
              Gaming Arenas
            </span>
            <ul className="space-y-1.5">
              <li>
                <button
                  onClick={() => {
                    sounds.playClick();
                    onSelectGame('aviator');
                  }}
                  className="hover:text-cyan-400 transition-colors"
                >
                  Aviator Supersonic Crash
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    sounds.playClick();
                    onSelectGame('roulette');
                  }}
                  className="hover:text-cyan-400 transition-colors"
                >
                  Space European Roulette
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    sounds.playClick();
                    onSelectGame('dice');
                  }}
                  className="hover:text-cyan-400 transition-colors"
                >
                  Lucky Cyber Dice
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    sounds.playClick();
                    onSelectGame('blackjack');
                  }}
                  className="hover:text-cyan-400 transition-colors"
                >
                  VIP High-Stakes Blackjack
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Rewards & Fair Play */}
          <div className="space-y-2 text-xs">
            <span className="font-bold text-slate-200 uppercase tracking-wider block">
              Player Protections
            </span>
            <ul className="space-y-1.5">
              <li>
                <button
                  onClick={() => {
                    sounds.playClick();
                    onOpenFairPledge();
                  }}
                  className="hover:text-cyan-400 transition-colors flex items-center gap-1.5"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Fair Play & Entertainment Rules</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    sounds.playClick();
                    onOpenDailyBonus();
                  }}
                  className="hover:text-cyan-400 transition-colors"
                >
                  Daily Complimentary SkyCoins
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    sounds.playClick();
                    onOpenRefill();
                  }}
                  className="hover:text-cyan-400 transition-colors"
                >
                  Free Coin Replenishment
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright & mandatory legal disclaimer */}
        <div className="border-t border-slate-900 pt-6 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-3">
          <div>
            © {new Date().getFullYear()} SkyPlay Casino. All rights reserved. 100% Simulated Social Gaming.
          </div>
          <div className="flex items-center gap-4">
            <span>Zero Real-Money Gambling</span>
            <span>·</span>
            <span>Virtual Coin Entertainment</span>
            <span>·</span>
            <span>Provably Fair Algorithms</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
