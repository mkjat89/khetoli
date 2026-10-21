import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// In-memory simulated storage for active server state
interface ServerRound {
  id: string;
  game: string;
  crashMultiplier?: number;
  serverSeed: string;
  serverHash: string;
  clientSeed: string;
  timestamp: number;
}

const recentServerRounds: ServerRound[] = [];

// Seed generator for Provably Fair simulation
function generateServerSeed(): { serverSeed: string; serverHash: string } {
  const serverSeed = crypto.randomBytes(32).toString('hex');
  const serverHash = crypto.createHash('sha256').update(serverSeed).digest('hex');
  return { serverSeed, serverHash };
}

// Deterministic crash point calculator from seeds
function calculateCrashPoint(serverSeed: string, clientSeed: string): number {
  const hash = crypto.createHmac('sha256', serverSeed).update(clientSeed).digest('hex');
  // Use first 8 characters (32 bits) of hash
  const subHash = hash.substring(0, 8);
  const intVal = parseInt(subHash, 16);
  const rand = intVal / 0xffffffff;

  // 5% instant bust
  if (rand < 0.05) {
    return parseFloat((1.0 + rand * 0.1).toFixed(2));
  }
  // Standard inverse distribution
  const multiplier = parseFloat((1.01 + 0.99 / (1.0001 - rand * 0.97)).toFixed(2));
  return Math.min(150.0, Math.max(1.0, multiplier));
}

// ================= API ROUTES =================

// 1. Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    platform: 'SkyPlay Casino Backend Server',
    environment: process.env.NODE_ENV || 'development',
    serverTime: Date.now(),
    virtualCurrencyOnly: true,
  });
});

// 2. Global Live Platform Stats
app.get('/api/stats', (req: Request, res: Response) => {
  const baseActive = 1420;
  const jitter = Math.floor(Math.sin(Date.now() / 15000) * 85);
  res.json({
    activePlayersOnline: baseActive + jitter,
    totalRoundsToday: 42180 + Math.floor((Date.now() % 86400000) / 10000),
    biggestFlightMultiplierToday: 118.45,
    biggestFlightWinner: 'NebulaKing (Celestial VIP)',
    totalSkyCoinsDistributed: 84592000,
    provablyFairActive: true,
  });
});

// 3. High Rollers VIP Leaderboard
app.get('/api/leaderboard', (req: Request, res: Response) => {
  res.json({
    leaderboard: [
      { rank: 1, name: 'QuantumPilot', tier: 'Celestial', totalWon: 8450000, bestMultiplier: 124.8, avatar: '👨‍🚀' },
      { rank: 2, name: 'SolarisAce', tier: 'Diamond', totalWon: 6120000, bestMultiplier: 94.2, avatar: '👑' },
      { rank: 3, name: 'Vortex99', tier: 'Diamond', totalWon: 4890000, bestMultiplier: 76.5, avatar: '⚡' },
      { rank: 4, name: 'AeroAce', tier: 'Platinum', totalWon: 3200000, bestMultiplier: 62.1, avatar: '🎯' },
      { rank: 5, name: 'Hyperion', tier: 'Platinum', totalWon: 2750000, bestMultiplier: 48.9, avatar: '🚀' },
    ],
  });
});

// 4. Provably Fair Aviator Crash Seed Generator
app.post('/api/games/aviator/new-round', (req: Request, res: Response) => {
  const { clientSeed = 'sky_client_' + Date.now().toString(16) } = req.body;
  const { serverSeed, serverHash } = generateServerSeed();
  const crashMultiplier = calculateCrashPoint(serverSeed, clientSeed);

  const round: ServerRound = {
    id: `round_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    game: 'aviator',
    crashMultiplier,
    serverSeed,
    serverHash,
    clientSeed,
    timestamp: Date.now(),
  };

  recentServerRounds.unshift(round);
  if (recentServerRounds.length > 50) recentServerRounds.pop();

  // Return server hash immediately, reveal serverSeed after round
  res.json({
    roundId: round.id,
    serverHash,
    clientSeed,
    timestamp: round.timestamp,
    // Note: in a simulated social game, client can get the crashMultiplier
    crashMultiplier,
  });
});

// 5. Server Bet Verification Endpoint
app.post('/api/bet/verify', (req: Request, res: Response) => {
  const { game, betAmount, currentBalance } = req.body;

  if (!game || !betAmount || betAmount <= 0) {
    return res.status(400).json({ error: 'Invalid game or bet amount' });
  }

  if (currentBalance !== undefined && currentBalance < betAmount) {
    return res.status(400).json({ error: 'Insufficient SkyCoins balance' });
  }

  const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  res.json({
    success: true,
    transactionId,
    game,
    betAmount,
    verifiedAt: Date.now(),
    message: 'Bet validated by SkyPlay Server',
  });
});

// 6. Free Coins Refill Endpoint
app.post('/api/wallet/refill', (req: Request, res: Response) => {
  const { bundle = 5000 } = req.body;
  const allowed = [5000, 25000, 100000];
  const grantAmount = allowed.includes(bundle) ? bundle : 5000;

  res.json({
    success: true,
    grantedSkyCoins: grantAmount,
    timestamp: Date.now(),
    message: `Granted ${grantAmount.toLocaleString()} Free SkyCoins`,
  });
});

// ================= VITE DEV / STATIC PRODUCTION =================

async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    // Dynamic Vite middleware import for development
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log('[SkyPlay Server] Vite middleware mounted in development mode');
  } else {
    // Serve production static assets from dist/
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
    console.log(`[SkyPlay Server] Serving production static assets from ${distPath}`);
  }

  app.listen(PORT, () => {
    console.log(`[SkyPlay Casino] Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[SkyPlay Server] Failed to start:', err);
  process.exit(1);
});
