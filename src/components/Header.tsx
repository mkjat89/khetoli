import React from 'react';
import { useGame } from '../context/GameContext';
import { sounds } from '../services/sound';
import { GameType } from '../types';
import { 
  Coins, 
  Gift, 
  Volume2, 
  VolumeX, 
  User, 
  PlusCircle, 
  Trophy, 
  History as HistoryIcon,
  ShieldCheck,
  Plane
} from 'lucide-react';

interface HeaderProps {
  activeGame: GameType;
  setActiveGame: (game: GameType) => void;
  onOpenDailyBonus: () => void;
  onOpenRefill: () => void;
  onOpenProfile: () => void;
  onOpenAchievements: () => void;
  onOpenHistory: () => void;
  onOpenFairPledge: () => void;
  onOpenLeaderboard: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeGame,
  setActiveGame,
  onOpenDailyBonus,
  onOpenRefill,
  onOpenProfile,
  onOpenAchievements,
  onOpenHistory,
  onOpenFairPledge,
  onOpenLeaderboard,
}) => {
  const { balance, profile, updateProfile, canClaimDaily, currentTier } = useGame();

  const toggleSound = () => {
    const nextVal = !profile.soundEnabled;
    updateProfile({ soundEnabled: nextVal });
    if (nextVal) sounds.playClick();
  };

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-slate-800/80 bg-slate-950/85 backdrop-blur-xl">
      {/* Top Responsible Gaming simulated disclaimer ticker */}
      <div className="bg-gradient-to-r from-cyan-950/50 via-purple-950/40 to-slate-950/60 border-b border-slate-800/60 px-4 py-1 text-[11px] text-slate-400 flex items-center justify-between">
        <div className="flex items-center gap-2 truncate">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0" />
          <span className="font-semibold text-cyan-300">SIMULATED SOCIAL CASINO:</span>
          <span className="truncate">Virtual SkyCoins (SC) entertainment only · No real money wagering, deposits or cash prizes</span>
        </div>
        <button
          onClick={onOpenFairPledge}
          className="text-slate-400 hover:text-cyan-300 underline underline-offset-2 shrink-0 hidden md:inline ml-3"
        >
          Fair Play & Entertainment Rules
        </button>
      </div>

      {/* Main Top Bar (Standard 3-Zone Contract) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-6">
        {/* Zone 1: Brand Wordmark */}
        <div 
          onClick={() => {
            sounds.playClick();
            setActiveGame('aviator');
          }}
          className="flex items-center gap-2.5 cursor-pointer whitespace-nowrap shrink-0 group"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 via-indigo-500 to-rose-500 p-0.5 shadow-lg group-hover:scale-105 transition-transform">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Plane className="w-5 h-5 text-cyan-400 -rotate-45" />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="font-display font-black text-xl tracking-tight text-white group-hover:text-cyan-300 transition-colors">
              SkyPlay<span className="text-amber-400">.</span>
            </span>
            <span className="text-[10px] text-slate-400 -mt-1 tracking-wider uppercase font-semibold">
              VIP Arcade
            </span>
          </div>
        </div>

        {/* Zone 2: Navigation Links (Single-line) */}
        <nav className="hidden lg:flex items-center gap-6 text-sm font-semibold text-slate-300 whitespace-nowrap shrink-0">
          <button
            onClick={() => {
              sounds.playClick();
              setActiveGame('aviator');
            }}
            className={`transition-colors py-1 ${
              activeGame === 'aviator' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'hover:text-white'
            }`}
          >
            Aviator Crash
          </button>
          <button
            onClick={() => {
              sounds.playClick();
              setActiveGame('roulette');
            }}
            className={`transition-colors py-1 ${
              activeGame === 'roulette' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'hover:text-white'
            }`}
          >
            Space Roulette
          </button>
          <button
            onClick={() => {
              sounds.playClick();
              setActiveGame('dice');
            }}
            className={`transition-colors py-1 ${
              activeGame === 'dice' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'hover:text-white'
            }`}
          >
            Lucky Dice
          </button>
          <button
            onClick={() => {
              sounds.playClick();
              setActiveGame('blackjack');
            }}
            className={`transition-colors py-1 ${
              activeGame === 'blackjack' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'hover:text-white'
            }`}
          >
            VIP Blackjack
          </button>
          <button
            onClick={onOpenAchievements}
            className="hover:text-amber-300 transition-colors flex items-center gap-1.5 text-xs text-amber-400/90"
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>Achievements</span>
          </button>
          <button
            onClick={() => {
              sounds.playClick();
              onOpenLeaderboard();
            }}
            className="hover:text-cyan-300 transition-colors flex items-center gap-1.5 text-xs text-cyan-400/90"
          >
            <Trophy className="w-3.5 h-3.5 text-cyan-400" />
            <span>Leaderboard</span>
          </button>
          <button
            onClick={onOpenHistory}
            className="hover:text-slate-100 transition-colors flex items-center gap-1.5 text-xs text-slate-400"
          >
            <HistoryIcon className="w-3.5 h-3.5" />
            <span>History</span>
          </button>
        </nav>

        {/* Zone 3: User Controls & Balance Action */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Virtual Coin Balance Widget */}
          <div className="flex items-center bg-slate-900/90 border border-slate-800 rounded-xl p-1 pl-3 shadow-inner">
            <Coins className="w-4 h-4 text-amber-400 mr-2 shrink-0 animate-pulse" />
            <div className="flex flex-col text-right mr-2 select-none">
              <span className="font-tabular font-extrabold text-sm sm:text-base text-amber-300 leading-tight">
                {balance.toLocaleString()}
              </span>
              <span className="text-[9px] uppercase tracking-wider font-semibold text-slate-400 leading-none">
                SkyCoins
              </span>
            </div>
            <button
              onClick={() => {
                sounds.playClick();
                onOpenRefill();
              }}
              title="Refill Free Demo Coins"
              className="p-1.5 hover:bg-slate-800 rounded-lg text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
            </button>
          </div>

          {/* Daily Bonus Reward Button */}
          <button
            onClick={() => {
              sounds.playClick();
              onOpenDailyBonus();
            }}
            className={`relative p-2 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 ${
              canClaimDaily
                ? 'bg-amber-500/20 border-amber-500/60 text-amber-300 shadow-md glow-gold animate-bounce'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
            title="Daily Simulated Reward"
          >
            <Gift className="w-4 h-4 text-amber-400" />
            <span className="hidden md:inline">{canClaimDaily ? 'Claim Free' : 'Daily'}</span>
            {canClaimDaily && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-400" />
            )}
          </button>

          {/* Sound Toggle */}
          <button
            onClick={toggleSound}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
            title={profile.soundEnabled ? 'Mute Audio' : 'Unmute Audio'}
          >
            {profile.soundEnabled ? <Volume2 className="w-4 h-4 text-cyan-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
          </button>

          {/* Profile / VIP Avatar Button */}
          <button
            onClick={() => {
              sounds.playClick();
              onOpenProfile();
            }}
            className="flex items-center gap-2 p-1 pl-1.5 pr-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-cyan-500/40 transition-colors"
            title="User Profile & Settings"
          >
            <div 
              className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs text-white"
              style={{ backgroundColor: currentTier.color }}
            >
              {profile.name.charAt(0).toUpperCase()}
            </div>
            <div className="text-left hidden sm:block">
              <div className="text-xs font-bold text-slate-200 leading-tight truncate max-w-[80px]">
                {profile.name}
              </div>
              <div className="text-[10px] text-slate-400 leading-tight">
                {currentTier.tier} VIP
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Mobile Secondary Game Sub-Bar */}
      <div className="lg:hidden flex items-center justify-around border-t border-slate-800/80 bg-slate-950/95 py-2 px-2 overflow-x-auto no-scrollbar gap-2">
        <button
          onClick={() => {
            sounds.playClick();
            setActiveGame('aviator');
          }}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 transition-all ${
            activeGame === 'aviator' ? 'bg-cyan-500 text-slate-950 shadow glow-blue' : 'text-slate-400'
          }`}
        >
          Aviator
        </button>
        <button
          onClick={() => {
            sounds.playClick();
            setActiveGame('roulette');
          }}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 transition-all ${
            activeGame === 'roulette' ? 'bg-cyan-500 text-slate-950 shadow glow-blue' : 'text-slate-400'
          }`}
        >
          Roulette
        </button>
        <button
          onClick={() => {
            sounds.playClick();
            setActiveGame('dice');
          }}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 transition-all ${
            activeGame === 'dice' ? 'bg-cyan-500 text-slate-950 shadow glow-blue' : 'text-slate-400'
          }`}
        >
          Lucky Dice
        </button>
        <button
          onClick={() => {
            sounds.playClick();
            setActiveGame('blackjack');
          }}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 transition-all ${
            activeGame === 'blackjack' ? 'bg-cyan-500 text-slate-950 shadow glow-blue' : 'text-slate-400'
          }`}
        >
          Blackjack
        </button>
        <button
          onClick={onOpenAchievements}
          className="px-2.5 py-1.5 rounded-lg text-xs text-amber-400 font-bold shrink-0"
        >
          Awards
        </button>
      </div>
    </header>
  );
};
