// API Client communicating with Express backend server

export interface ServerStats {
  activePlayersOnline: number;
  totalRoundsToday: number;
  biggestFlightMultiplierToday: number;
  biggestFlightWinner: string;
  totalSkyCoinsDistributed: number;
  provablyFairActive: boolean;
}

export interface LeaderboardEntry {
  rank: number;
  name: string;
  tier: string;
  totalWon: number;
  bestMultiplier: number;
  avatar: string;
}

export const api = {
  // Check backend server health
  async checkHealth(): Promise<{ status: string; serverTime: number; virtualCurrencyOnly: boolean }> {
    try {
      const res = await fetch('/api/health');
      if (!res.ok) throw new Error('Server returned non-200');
      return await res.json();
    } catch {
      return { status: 'offline', serverTime: Date.now(), virtualCurrencyOnly: true };
    }
  },

  // Get live server platform telemetry
  async getStats(): Promise<ServerStats | null> {
    try {
      const res = await fetch('/api/stats');
      if (!res.ok) throw new Error('Failed to fetch stats');
      return await res.json();
    } catch {
      return null;
    }
  },

  // Get high-rollers leaderboard
  async getLeaderboard(): Promise<LeaderboardEntry[]> {
    try {
      const res = await fetch('/api/leaderboard');
      if (!res.ok) throw new Error('Failed to fetch leaderboard');
      const data = await res.json();
      return data.leaderboard || [];
    } catch {
      return [];
    }
  },

  // Request new provably fair round for Aviator
  async getAviatorRound(clientSeed?: string): Promise<{
    roundId: string;
    serverHash: string;
    clientSeed: string;
    crashMultiplier: number;
  } | null> {
    try {
      const res = await fetch('/api/games/aviator/new-round', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientSeed }),
      });
      if (!res.ok) throw new Error('Round generation failed');
      return await res.json();
    } catch {
      return null;
    }
  },

  // Verify bet on backend
  async verifyBet(game: string, betAmount: number, currentBalance: number): Promise<boolean> {
    try {
      const res = await fetch('/api/bet/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ game, betAmount, currentBalance }),
      });
      return res.ok;
    } catch {
      return true; // Fallback to client verification if offline
    }
  },

  // Request free refill on server
  async refillWallet(bundle: number): Promise<number | null> {
    try {
      const res = await fetch('/api/wallet/refill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bundle }),
      });
      if (!res.ok) throw new Error('Refill failed');
      const data = await res.json();
      return data.grantedSkyCoins;
    } catch {
      return null;
    }
  },
};
