export type GameType = 'aviator' | 'roulette' | 'dice' | 'blackjack';

export interface BetHistoryItem {
  id: string;
  game: GameType;
  gameTitle: string;
  timestamp: number;
  betAmount: number;
  multiplier: number;
  payout: number;
  resultText: string;
  won: boolean;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  reward: number;
  unlocked: boolean;
  unlockedAt?: number;
  icon: string;
  progress: number;
  maxProgress: number;
}

export interface UserProfile {
  name: string;
  avatar: string;
  soundEnabled: boolean;
  fastMode: boolean;
  joinedDate: number;
  totalWagered: number;
  totalWon: number;
  gamesPlayed: number;
  lastDailyClaim?: number;
}

export type VIPTier = 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond' | 'Celestial';

export interface VIPTierInfo {
  tier: VIPTier;
  minWagered: number;
  cashbackPercent: number;
  bonusMultiplier: number;
  color: string;
}
