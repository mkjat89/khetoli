import React, { useState } from 'react';
import { GameProvider, useGame } from './context/GameContext';
import { GameType } from './types';
import { sounds } from './services/sound';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { FeaturedGames } from './components/FeaturedGames';
import { Footer } from './components/Footer';

// Games
import { AviatorGame } from './games/AviatorGame';
import { RouletteGame } from './games/RouletteGame';
import { DiceGame } from './games/DiceGame';
import { BlackjackGame } from './games/BlackjackGame';

// Modals
import { DailyBonusModal } from './components/DailyBonusModal';
import { RefillModal } from './components/RefillModal';
import { ProfileModal } from './components/ProfileModal';
import { AchievementsModal } from './components/AchievementsModal';
import { HistoryModal } from './components/HistoryModal';
import { ResponsibleGamingModal } from './components/ResponsibleGamingModal';
import { LeaderboardModal } from './components/LeaderboardModal';

import { Plane, RotateCw, Dices, Layers, ShieldCheck, Sparkles, Trophy } from 'lucide-react';

const CasinoContent: React.FC = () => {
  const [activeGame, setActiveGame] = useState<GameType>('aviator');

  // Modal visibility states
  const [isDailyOpen, setIsDailyOpen] = useState(false);
  const [isRefillOpen, setIsRefillOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isAchievementsOpen, setIsAchievementsOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isFairPledgeOpen, setIsFairPledgeOpen] = useState(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);

  const scrollToGameArena = () => {
    const arena = document.getElementById('game-arena');
    if (arena) {
      arena.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#030712] text-slate-100 antialiased selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Header */}
      <Header
        activeGame={activeGame}
        setActiveGame={(g) => {
          setActiveGame(g);
          scrollToGameArena();
        }}
        onOpenDailyBonus={() => setIsDailyOpen(true)}
        onOpenRefill={() => setIsRefillOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
        onOpenAchievements={() => setIsAchievementsOpen(true)}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenFairPledge={() => setIsFairPledgeOpen(true)}
        onOpenLeaderboard={() => setIsLeaderboardOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-10">
        {/* Luxury Hero Banner (Featured Game Spotlight) */}
        <Hero
          onPlayAviator={() => {
            setActiveGame('aviator');
            scrollToGameArena();
          }}
          onSelectGame={(g) => {
            setActiveGame(g);
            scrollToGameArena();
          }}
        />

        {/* Active Game Arena */}
        <section id="game-arena" className="space-y-4 pt-2">
          {/* Active Arena Selector Tabs */}
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
              <button
                onClick={() => {
                  sounds.playClick();
                  setActiveGame('aviator');
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 ${
                  activeGame === 'aviator'
                    ? 'bg-cyan-500 text-slate-950 shadow-lg glow-blue'
                    : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <Plane className="w-4 h-4 -rotate-45" />
                <span>Aviator Crash (Featured)</span>
              </button>

              <button
                onClick={() => {
                  sounds.playClick();
                  setActiveGame('roulette');
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 ${
                  activeGame === 'roulette'
                    ? 'bg-purple-500 text-white shadow-lg glow-purple'
                    : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <RotateCw className="w-4 h-4" />
                <span>Space Roulette</span>
              </button>

              <button
                onClick={() => {
                  sounds.playClick();
                  setActiveGame('dice');
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 ${
                  activeGame === 'dice'
                    ? 'bg-rose-500 text-white shadow-lg glow-blue'
                    : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <Dices className="w-4 h-4" />
                <span>Lucky Dice</span>
              </button>

              <button
                onClick={() => {
                  sounds.playClick();
                  setActiveGame('blackjack');
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 ${
                  activeGame === 'blackjack'
                    ? 'bg-amber-500 text-slate-950 shadow-lg glow-gold'
                    : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>VIP Blackjack</span>
              </button>
            </div>

            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Simulated Provably Fair Live Session</span>
            </div>
          </div>

          {/* Render Current Game Component */}
          <div className="transition-all duration-300">
            {activeGame === 'aviator' && <AviatorGame />}
            {activeGame === 'roulette' && <RouletteGame />}
            {activeGame === 'dice' && <DiceGame />}
            {activeGame === 'blackjack' && <BlackjackGame />}
          </div>
        </section>

        {/* Featured Games Directory Showcase */}
        <FeaturedGames
          activeGame={activeGame}
          onSelectGame={(g) => {
            setActiveGame(g);
            scrollToGameArena();
          }}
        />

        {/* VIP Club & Responsible Social Gaming Trust Banner */}
        <section className="glass-panel rounded-2xl border border-slate-800/80 p-6 sm:p-8 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/40">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-sm text-white">100% Free SkyCoins</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Daily rewards and unlimited refills. Experience authentic casino math and mechanics with zero risk to personal finances.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                <Trophy className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-sm text-white">6-Tier VIP Rewards</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Level up from Bronze to Celestial VIP by wagering coins in games. Unlock bonus multipliers up to 3.0x on daily rewards.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-sm text-white">Provably Fair Algorithms</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Cryptographic hashing simulates transparent random number generation so every crash point, roll, and spin is mathematically verifiable.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <Footer
        onSelectGame={(g) => {
          setActiveGame(g);
          scrollToGameArena();
        }}
        onOpenFairPledge={() => setIsFairPledgeOpen(true)}
        onOpenDailyBonus={() => setIsDailyOpen(true)}
        onOpenRefill={() => setIsRefillOpen(true)}
      />

      {/* Interactive Modals */}
      <DailyBonusModal isOpen={isDailyOpen} onClose={() => setIsDailyOpen(false)} />
      <RefillModal isOpen={isRefillOpen} onClose={() => setIsRefillOpen(false)} />
      <ProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
      <AchievementsModal isOpen={isAchievementsOpen} onClose={() => setIsAchievementsOpen(false)} />
      <HistoryModal isOpen={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} />
      <ResponsibleGamingModal isOpen={isFairPledgeOpen} onClose={() => setIsFairPledgeOpen(false)} />
      <LeaderboardModal isOpen={isLeaderboardOpen} onClose={() => setIsLeaderboardOpen(false)} />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <GameProvider>
      <CasinoContent />
    </GameProvider>
  );
};

export default App;
