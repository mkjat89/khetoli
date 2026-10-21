import React from 'react';
import { GameType } from '../types';
import { sounds } from '../services/sound';
import { Plane, RotateCw, Dices, Layers, Play } from 'lucide-react';

import aviatorImg from '../assets/images/hero_skyplay_aviator_1792565407655.jpg';
import rouletteImg from '../assets/images/game_thumb_roulette_1792565408346.jpg';
import diceImg from '../assets/images/game_thumb_dice_1792565408746.jpg';
import blackjackImg from '../assets/images/game_thumb_blackjack_1792565408587.jpg';

interface FeaturedGamesProps {
  activeGame: GameType;
  onSelectGame: (game: GameType) => void;
}

interface GameCardMeta {
  id: GameType;
  title: string;
  category: string;
  payoutBadge: string;
  description: string;
  image: string;
  icon: React.ReactNode;
}

const GAMES: GameCardMeta[] = [
  {
    id: 'aviator',
    title: 'Aviator Crash',
    category: 'Crash Multiplier',
    payoutBadge: 'Up to 150x',
    description: 'Supersonic rising curve. Dual bet panels, auto-cashout, and live round telemetry.',
    image: aviatorImg,
    icon: <Plane className="w-4 h-4 text-cyan-400" />,
  },
  {
    id: 'roulette',
    title: 'Space Roulette',
    category: 'European Wheel',
    payoutBadge: '35:1 Straight-Up',
    description: 'Orbital physics wheel, single zero pocket, dozens, columns, and outside predictions.',
    image: rouletteImg,
    icon: <RotateCw className="w-4 h-4 text-purple-400" />,
  },
  {
    id: 'dice',
    title: 'Lucky Dice',
    category: 'Dice & Craps',
    payoutBadge: '30:1 Boxcars',
    description: 'Tumbling 3D dice faces with classic Craps Over-Under 7 and Cyber Slider threshold modes.',
    image: diceImg,
    icon: <Dices className="w-4 h-4 text-rose-400" />,
  },
  {
    id: 'blackjack',
    title: 'VIP Blackjack',
    category: 'Card Table',
    payoutBadge: '3:2 Natural 21',
    description: 'Luxury navy felt card table. Deal, Hit, Stand, Double Down with dealer soft 17 rules.',
    image: blackjackImg,
    icon: <Layers className="w-4 h-4 text-amber-400" />,
  },
];

export const FeaturedGames: React.FC<FeaturedGamesProps> = ({ activeGame, onSelectGame }) => {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Virtual Gaming Arenas
          </h2>
          <p className="text-xs text-slate-400">
            Select an arena to enter. All games utilize free virtual SkyCoins with certified pseudo-random outcome simulations.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {GAMES.map((game) => {
          const isActive = activeGame === game.id;
          return (
            <div
              key={game.id}
              onClick={() => {
                sounds.playClick();
                onSelectGame(game.id);
              }}
              className={`group cursor-pointer rounded-2xl glass-panel p-3 border transition-all duration-300 flex flex-col justify-between overflow-hidden relative ${
                isActive
                  ? 'border-cyan-400/80 ring-2 ring-cyan-500/30 bg-slate-900/90 shadow-xl'
                  : 'border-slate-800 hover:border-slate-700 bg-slate-950/60 hover:-translate-y-1'
              }`}
            >
              {/* Thumbnail Container */}
              <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-slate-900 mb-3">
                <img
                  src={game.image}
                  alt={game.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent" />

                {/* Top category label & payout */}
                <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between text-[11px]">
                  <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-950/80 backdrop-blur-md text-slate-300 border border-slate-700/60 font-medium">
                    {game.icon}
                    <span>{game.category}</span>
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold font-tabular">
                    {game.payoutBadge}
                  </span>
                </div>

                {/* In-thumbnail Play Hover Overlay */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-slate-950/40 backdrop-blur-[2px]">
                  <span className="w-12 h-12 rounded-full bg-cyan-500 text-slate-950 flex items-center justify-center shadow-lg glow-blue transform scale-75 group-hover:scale-100 transition-transform">
                    <Play className="w-5 h-5 fill-current ml-0.5" />
                  </span>
                </div>
              </div>

              {/* Title & Description */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-base text-white group-hover:text-cyan-300 transition-colors">
                    {game.title}
                  </h3>
                  {isActive && (
                    <span className="text-[10px] uppercase font-bold tracking-wider text-cyan-400">
                      Active
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                  {game.description}
                </p>
              </div>

              {/* Action Button */}
              <div className="pt-3">
                <button
                  type="button"
                  className={`w-full py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    isActive
                      ? 'bg-cyan-500 text-slate-950 font-black'
                      : 'bg-slate-900 text-slate-300 group-hover:bg-slate-800 group-hover:text-white border border-slate-800'
                  }`}
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>{isActive ? 'Currently Playing' : 'Play Arena'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
