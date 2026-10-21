import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { BetHistoryItem, Achievement, UserProfile, VIPTier, VIPTierInfo } from '../types';
import { sounds } from '../services/sound';
import { api } from '../services/api';

export const VIP_TIERS: VIPTierInfo[] = [
  { tier: 'Bronze', minWagered: 0, cashbackPercent: 1, bonusMultiplier: 1.0, color: '#cd7f32' },
  { tier: 'Silver', minWagered: 25000, cashbackPercent: 2, bonusMultiplier: 1.1, color: '#c0c0c0' },
  { tier: 'Gold', minWagered: 100000, cashbackPercent: 3, bonusMultiplier: 1.25, color: '#f59e0b' },
  { tier: 'Platinum', minWagered: 500000, cashbackPercent: 5, bonusMultiplier: 1.5, color: '#38bdf8' },
  { tier: 'Diamond', minWagered: 2000000, cashbackPercent: 8, bonusMultiplier: 2.0, color: '#a855f7' },
  { tier: 'Celestial', minWagered: 10000000, cashbackPercent: 12, bonusMultiplier: 3.0, color: '#ec4899' },
];

const INITIAL_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_flight',
    title: 'First Flight',
    description: 'Place your first bet on Aviator',
    reward: 500,
    unlocked: false,
    icon: 'Plane',
    progress: 0,
    maxProgress: 1,
  },
  {
    id: 'sky_high',
    title: 'Stratosphere Ace',
    description: 'Cash out at 5.00x or higher in Aviator',
    reward: 2500,
    unlocked: false,
    icon: 'Rocket',
    progress: 0,
    maxProgress: 1,
  },
  {
    id: 'blackjack_21',
    title: 'Natural 21',
    description: 'Hit a natural Blackjack (Ace + 10-value card)',
    reward: 1500,
    unlocked: false,
    icon: 'Sparkles',
    progress: 0,
    maxProgress: 1,
  },
  {
    id: 'roulette_hit',
    title: 'Orbit Master',
    description: 'Win a straight-up single number bet in Space Roulette',
    reward: 5000,
    unlocked: false,
    icon: 'Disc',
    progress: 0,
    maxProgress: 1,
  },
  {
    id: 'lucky_seven',
    title: 'Cosmic 7',
    description: 'Roll an exact sum of 7 on Lucky Dice',
    reward: 1000,
    unlocked: false,
    icon: 'Dices',
    progress: 0,
    maxProgress: 1,
  },
  {
    id: 'high_roller',
    title: 'High Roller Elite',
    description: 'Wager 5,000 SkyCoins in a single round',
    reward: 3000,
    unlocked: false,
    icon: 'Crown',
    progress: 0,
    maxProgress: 1,
  },
  {
    id: 'wager_millionaire',
    title: 'Centurion Gambler',
    description: 'Reach 100,000 total SkyCoins wagered',
    reward: 10000,
    unlocked: false,
    icon: 'Trophy',
    progress: 0,
    maxProgress: 100000,
  },
  {
    id: 'daily_streak',
    title: 'Dedicated Voyager',
    description: 'Claim your daily simulated bonus reward',
    reward: 1000,
    unlocked: false,
    icon: 'Calendar',
    progress: 0,
    maxProgress: 1,
  },
];

interface GameContextType {
  balance: number;
  profile: UserProfile;
  history: BetHistoryItem[];
  achievements: Achievement[];
  currentTier: VIPTierInfo;
  nextTier: VIPTierInfo | null;
  tierProgress: number;
  placeBet: (amount: number, game: string) => boolean;
  addPayout: (amount: number, game: string) => void;
  recordBetResult: (item: Omit<BetHistoryItem, 'id' | 'timestamp'>) => void;
  claimDailyBonus: () => { amount: number; success: boolean; message: string };
  canClaimDaily: boolean;
  timeUntilNextDaily: string;
  refillBalance: (amount?: number) => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
  resetAllStats: () => void;
  triggerConfetti: () => void;
  triggerBigConfetti: () => void;
  unlockAchievement: (id: string) => void;
  incrementAchievementProgress: (id: string, amount?: number) => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

const STORAGE_KEYS = {
  BALANCE: 'skyplay_balance_v1',
  PROFILE: 'skyplay_profile_v1',
  HISTORY: 'skyplay_history_v1',
  ACHIEVEMENTS: 'skyplay_achievements_v1',
};

const DEFAULT_PROFILE: UserProfile = {
  name: 'SkyCaptain',
  avatar: 'astronaut',
  soundEnabled: true,
  fastMode: false,
  joinedDate: Date.now(),
  totalWagered: 0,
  totalWon: 0,
  gamesPlayed: 0,
};

export const GameProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [balance, setBalance] = useState<number>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.BALANCE);
    return saved !== null ? Math.max(0, parseFloat(saved)) : 10000; // Start with 10,000 demo SkyCoins
  });

  const [profile, setProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PROFILE);
    if (saved) {
      try {
        return { ...DEFAULT_PROFILE, ...JSON.parse(saved) };
      } catch {}
    }
    return DEFAULT_PROFILE;
  });

  const [history, setHistory] = useState<BetHistoryItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.HISTORY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return [];
  });

  const [achievements, setAchievements] = useState<Achievement[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ACHIEVEMENTS);
    if (saved) {
      try {
        const loaded: Achievement[] = JSON.parse(saved);
        return INITIAL_ACHIEVEMENTS.map((initial) => {
          const match = loaded.find((l) => l.id === initial.id);
          return match ? { ...initial, ...match } : initial;
        });
      } catch {}
    }
    return INITIAL_ACHIEVEMENTS;
  });

  // Sync state to local storage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.BALANCE, balance.toString());
  }, [balance]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
    sounds.setEnabled(profile.soundEnabled);
  }, [profile]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history.slice(0, 100)));
  }, [history]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ACHIEVEMENTS, JSON.stringify(achievements));
  }, [achievements]);

  // VIP Tier calculations
  const totalWagered = profile.totalWagered;
  let currentTierIndex = 0;
  for (let i = VIP_TIERS.length - 1; i >= 0; i--) {
    if (totalWagered >= VIP_TIERS[i].minWagered) {
      currentTierIndex = i;
      break;
    }
  }
  const currentTier = VIP_TIERS[currentTierIndex];
  const nextTier = currentTierIndex < VIP_TIERS.length - 1 ? VIP_TIERS[currentTierIndex + 1] : null;

  const tierProgress = nextTier
    ? Math.min(
        100,
        Math.max(
          0,
          ((totalWagered - currentTier.minWagered) / (nextTier.minWagered - currentTier.minWagered)) * 100
        )
      )
    : 100;

  // Confetti helpers
  const triggerConfetti = useCallback(() => {
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#38bdf8', '#a855f7', '#f59e0b', '#ec4899'],
      });
    } catch {}
  }, []);

  const triggerBigConfetti = useCallback(() => {
    try {
      const end = Date.now() + 1.2 * 1000;
      const colors = ['#f59e0b', '#38bdf8', '#10b981', '#ec4899', '#ffffff'];
      (function frame() {
        confetti({
          particleCount: 4,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: colors,
        });
        confetti({
          particleCount: 4,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: colors,
        });
        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      })();
    } catch {}
  }, []);

  // Unlock achievement
  const unlockAchievement = useCallback((id: string) => {
    setAchievements((prev) =>
      prev.map((a) => {
        if (a.id === id && !a.unlocked) {
          triggerBigConfetti();
          sounds.playBigWin();
          setBalance((b) => b + a.reward);
          return { ...a, unlocked: true, unlockedAt: Date.now(), progress: a.maxProgress };
        }
        return a;
      })
    );
  }, [triggerBigConfetti]);

  const incrementAchievementProgress = useCallback(
    (id: string, amount: number = 1) => {
      setAchievements((prev) =>
        prev.map((a) => {
          if (a.id === id && !a.unlocked) {
            const newProgress = Math.min(a.maxProgress, a.progress + amount);
            if (newProgress >= a.maxProgress) {
              triggerBigConfetti();
              sounds.playBigWin();
              setBalance((b) => b + a.reward);
              return { ...a, progress: newProgress, unlocked: true, unlockedAt: Date.now() };
            }
            return { ...a, progress: newProgress };
          }
          return a;
        })
      );
    },
    [triggerBigConfetti]
  );

  // Betting & Payout handlers
  const placeBet = useCallback((amount: number, game: string = 'casino'): boolean => {
    if (amount <= 0) return false;
    if (balance < amount) return false;

    // Verify transaction asynchronously with Express backend
    api.verifyBet(game, amount, balance).catch(() => {});

    setBalance((prev) => Math.max(0, prev - amount));
    setProfile((prev) => {
      const newWagered = prev.totalWagered + amount;
      return {
        ...prev,
        totalWagered: newWagered,
        gamesPlayed: prev.gamesPlayed + 1,
      };
    });

    if (amount >= 5000) {
      unlockAchievement('high_roller');
    }

    setAchievements((prev) =>
      prev.map((a) => {
        if (a.id === 'wager_millionaire' && !a.unlocked) {
          const newProg = Math.min(a.maxProgress, a.progress + amount);
          if (newProg >= a.maxProgress) {
            triggerBigConfetti();
            sounds.playBigWin();
            setBalance((b) => b + a.reward);
            return { ...a, progress: newProg, unlocked: true, unlockedAt: Date.now() };
          }
          return { ...a, progress: newProg };
        }
        return a;
      })
    );

    return true;
  }, [balance, unlockAchievement, triggerBigConfetti]);

  const addPayout = useCallback((amount: number) => {
    if (amount > 0) {
      setBalance((prev) => prev + amount);
      setProfile((prev) => ({
        ...prev,
        totalWon: prev.totalWon + amount,
      }));
    }
  }, []);

  const recordBetResult = useCallback(
    (item: Omit<BetHistoryItem, 'id' | 'timestamp'>) => {
      const fullItem: BetHistoryItem = {
        ...item,
        id: Math.random().toString(36).substring(2, 9),
        timestamp: Date.now(),
      };
      setHistory((prev) => [fullItem, ...prev.slice(0, 99)]);
    },
    []
  );

  // Daily reward logic (24h cooldown or instant demo refill)
  const DAILY_INTERVAL_MS = 24 * 60 * 60 * 1000;
  const lastClaim = profile.lastDailyClaim || 0;
  const now = Date.now();
  const canClaimDaily = now - lastClaim >= DAILY_INTERVAL_MS;

  const [timeRemaining, setTimeRemaining] = useState<number>(
    Math.max(0, DAILY_INTERVAL_MS - (now - lastClaim))
  );

  useEffect(() => {
    const timer = setInterval(() => {
      const diff = Math.max(0, DAILY_INTERVAL_MS - (Date.now() - (profile.lastDailyClaim || 0)));
      setTimeRemaining(diff);
    }, 1000);
    return () => clearInterval(timer);
  }, [profile.lastDailyClaim]);

  const formatTime = (ms: number) => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const mins = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const secs = Math.floor((ms % (1000 * 60)) / 1000);
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const claimDailyBonus = useCallback(() => {
    const baseReward = 2500;
    const tierBonus = currentTier.bonusMultiplier;
    const rewardAmount = Math.round(baseReward * tierBonus);

    setBalance((prev) => prev + rewardAmount);
    setProfile((prev) => ({
      ...prev,
      lastDailyClaim: Date.now(),
    }));

    unlockAchievement('daily_streak');
    triggerBigConfetti();
    sounds.playBigWin();

    return {
      amount: rewardAmount,
      success: true,
      message: `You received ${rewardAmount.toLocaleString()} free SkyCoins! (${currentTier.tier} VIP ${tierBonus}x boost applied)`,
    };
  }, [currentTier, unlockAchievement, triggerBigConfetti]);

  const refillBalance = useCallback((amount: number = 5000) => {
    api.refillWallet(amount).catch(() => {});
    setBalance((prev) => prev + amount);
    sounds.playCashout();
    triggerConfetti();
  }, [triggerConfetti]);

  const updateProfile = useCallback((updates: Partial<UserProfile>) => {
    setProfile((prev) => ({ ...prev, ...updates }));
  }, []);

  const resetAllStats = useCallback(() => {
    setBalance(10000);
    setProfile({
      ...DEFAULT_PROFILE,
      joinedDate: Date.now(),
    });
    setHistory([]);
    setAchievements(INITIAL_ACHIEVEMENTS);
    localStorage.removeItem(STORAGE_KEYS.BALANCE);
    localStorage.removeItem(STORAGE_KEYS.PROFILE);
    localStorage.removeItem(STORAGE_KEYS.HISTORY);
    localStorage.removeItem(STORAGE_KEYS.ACHIEVEMENTS);
    sounds.playCashout();
  }, []);

  return (
    <GameContext.Provider
      value={{
        balance,
        profile,
        history,
        achievements,
        currentTier,
        nextTier,
        tierProgress,
        placeBet,
        addPayout,
        recordBetResult,
        claimDailyBonus,
        canClaimDaily,
        timeUntilNextDaily: formatTime(timeRemaining),
        refillBalance,
        updateProfile,
        resetAllStats,
        triggerConfetti,
        triggerBigConfetti,
        unlockAchievement,
        incrementAchievementProgress,
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};
