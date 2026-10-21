import React from 'react';
import { GameType } from '../types';
import { sounds } from '../services/sound';
import { Plane, TrendingUp, Sparkles, Shield, Trophy } from 'lucide-react';
import aviatorHeroImg from '../assets/images/hero_skyplay_aviator_1792565407655.jpg';

interface HeroProps {
  onPlayAviator: () => void;
  onSelectGame: (game: GameType) => void;
}

export const Hero: React.FC<HeroProps> = ({ onPlayAviator, onSelectGame }) => {
  return (
    <section className="relative overflow-hidden rounded-3xl glass-panel border border-slate-800/80 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950/70 p-6 sm:p-10 shadow-2xl">
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Editorial Copy (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400">
            <span>Featured Title</span>
            <span aria-hidden="true">·</span>
            <span>Provably Fair Multiplier</span>
            <span aria-hidden="true">·</span>
            <span>Real-Time Cashout</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.08] text-balance">
            Soar Past The Limits in <span className="bg-gradient-to-r from-cyan-400 via-rose-400 to-amber-300 bg-clip-text text-transparent">SkyPlay Aviator</span>
          </h1>

          <p className="text-sm sm:text-base text-slate-300 max-w-xl leading-relaxed">
            Experience the ultimate virtual-coin crash adrenaline. Place dual simultaneous bets, track the rising supersonic multiplier curve, and cash out before the jet ascends into orbit. 100% simulated social gaming with zero financial risk.
          </p>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-3 gap-4 py-2 border-y border-slate-800/80 max-w-lg">
            <div>
              <div className="text-xl sm:text-2xl font-black text-amber-400 font-tabular">150.00x</div>
              <div className="text-xs text-slate-400">Max Flight Boost</div>
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-black text-cyan-400 font-tabular">98.5%</div>
              <div className="text-xs text-slate-400">Simulated RTP</div>
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-black text-purple-400 font-tabular">Dual</div>
              <div className="text-xs text-slate-400">Simultaneous Bets</div>
            </div>
          </div>

          {/* Primary Action Button */}
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              onClick={() => {
                sounds.playClick();
                onPlayAviator();
              }}
              className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-black text-base shadow-xl glow-blue active:scale-98 transition-all flex items-center gap-2"
            >
              <Plane className="w-5 h-5 -rotate-45" />
              <span>LAUNCH AVIATOR FLIGHT</span>
            </button>
            <button
              onClick={() => {
                sounds.playClick();
                onSelectGame('roulette');
              }}
              className="px-5 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 font-bold text-sm transition-colors"
            >
              Explore Table Games
            </button>
          </div>
        </div>

        {/* Right High-Fidelity Visual Card (5 cols) */}
        <div className="lg:col-span-5 relative group">
          <div className="relative rounded-2xl overflow-hidden border border-slate-700/60 shadow-2xl bg-slate-900 aspect-[16/10]">
            <img
              src={aviatorHeroImg}
              alt="SkyPlay Aviator supersonic jet soaring into nebula"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
            {/* Gradient scrim */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />

            {/* In-visual badge overlay */}
            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                <span className="font-bold text-white font-tabular">LIVE ROUND IN PROGRESS</span>
              </div>
              <span className="font-tabular font-extrabold text-amber-300 text-sm">
                Next Flight: 5s
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
