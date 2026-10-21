import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useGame } from '../context/GameContext';
import { sounds } from '../services/sound';
import { api } from '../services/api';
import { 
  Plane, 
  TrendingUp, 
  Clock, 
  ShieldCheck, 
  Coins, 
  Sliders, 
  Zap, 
  AlertCircle,
  Users
} from 'lucide-react';

interface BetPanelState {
  betAmount: number;
  isBetPlaced: boolean; // Queued for current/next flight
  isCashedOut: boolean;
  cashedOutMultiplier: number;
  cashedOutPayout: number;
  autoCashoutEnabled: boolean;
  autoCashoutMultiplier: number;
}

interface SimulatedPlayer {
  id: string;
  name: string;
  avatar: string;
  bet: number;
  targetMultiplier: number;
  cashedOut: boolean;
}

const BOT_NAMES = [
  'AeroAce', 'Vortex99', 'NebulaKing', 'Solaris', 'QuantumPilot',
  'SkyFalcon', 'ZeroG', 'CyberFalcon', 'Hyperion', 'Starlight7'
];

export const AviatorGame: React.FC = () => {
  const { balance, placeBet, addPayout, recordBetResult, unlockAchievement, triggerConfetti } = useGame();

  // Flight round states
  const [gameState, setGameState] = useState<'WAITING' | 'COUNTDOWN' | 'FLYING' | 'CRASHED'>('COUNTDOWN');
  const [multiplier, setMultiplier] = useState<number>(1.00);
  const [crashPoint, setCrashPoint] = useState<number>(2.25);
  const [countdown, setCountdown] = useState<number>(5.0);
  const [historyRounds, setHistoryRounds] = useState<number[]>([1.45, 2.85, 1.12, 14.60, 3.22, 1.88, 5.40, 1.05, 22.10, 1.95]);

  // Dual Betting Panels (like standard Aviator interface)
  const [panel1, setPanel1] = useState<BetPanelState>({
    betAmount: 100,
    isBetPlaced: false,
    isCashedOut: false,
    cashedOutMultiplier: 0,
    cashedOutPayout: 0,
    autoCashoutEnabled: false,
    autoCashoutMultiplier: 2.0,
  });

  const [panel2, setPanel2] = useState<BetPanelState>({
    betAmount: 200,
    isBetPlaced: false,
    isCashedOut: false,
    cashedOutMultiplier: 0,
    cashedOutPayout: 0,
    autoCashoutEnabled: true,
    autoCashoutMultiplier: 1.5,
  });

  // Simulated co-players for realistic casino community vibe
  const [simulatedPlayers, setSimulatedPlayers] = useState<SimulatedPlayer[]>([]);
  const [showFairModal, setShowFairModal] = useState(false);
  const [roundSeed, setRoundSeed] = useState({
    serverSeed: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    clientSeed: 'skyplay_seed_flight_' + Date.now().toString(16),
  });

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const currentMultiplierRef = useRef<number>(1.00);
  currentMultiplierRef.current = multiplier;

  // Generate a fair crash point:
  // Random multiplier distribution with realistic Aviator house model
  const generateCrashPoint = useCallback(() => {
    const rand = Math.random();
    // 6% instant bust around 1.00x - 1.10x
    if (rand < 0.06) {
      return parseFloat((1.00 + Math.random() * 0.1).toFixed(2));
    }
    // Standard inverse distribution
    const point = parseFloat((1.01 + 0.99 / (1.0001 - Math.random() * 0.98)).toFixed(2));
    // Cap at 150x for enjoyable simulated gameplay
    return Math.min(point, 150.0);
  }, []);

  // Initialize simulated co-players for the upcoming round
  const initSimulatedPlayers = useCallback(() => {
    const count = 6 + Math.floor(Math.random() * 5);
    const bots: SimulatedPlayer[] = [];
    const shuffled = [...BOT_NAMES].sort(() => 0.5 - Math.random());

    for (let i = 0; i < count; i++) {
      const name = shuffled[i % shuffled.length];
      const bet = [50, 100, 250, 500, 1000, 2500][Math.floor(Math.random() * 6)];
      // Random target multiplier between 1.15 and 8.00
      const targetMultiplier = parseFloat((1.15 + Math.random() * 4.5).toFixed(2));
      bots.push({
        id: `bot-${i}-${Date.now()}`,
        name,
        avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${name}`,
        bet,
        targetMultiplier,
        cashedOut: false,
      });
    }
    setSimulatedPlayers(bots);
  }, []);

  // Cashout action for Panel 1
  const cashOutPanel1 = useCallback(() => {
    if (gameState !== 'FLYING' || !panel1.isBetPlaced || panel1.isCashedOut) return;
    const curMult = currentMultiplierRef.current;
    const payout = Math.floor(panel1.betAmount * curMult);

    sounds.playCashout();
    if (curMult >= 5.0) {
      triggerConfetti();
      unlockAchievement('sky_high');
    }

    addPayout(payout, 'aviator');
    recordBetResult({
      game: 'aviator',
      gameTitle: 'Aviator Flight',
      betAmount: panel1.betAmount,
      multiplier: curMult,
      payout,
      resultText: `Cashed out at ${curMult.toFixed(2)}x`,
      won: true,
    });

    setPanel1((prev) => ({
      ...prev,
      isCashedOut: true,
      cashedOutMultiplier: curMult,
      cashedOutPayout: payout,
    }));
  }, [gameState, panel1.isBetPlaced, panel1.isCashedOut, panel1.betAmount, addPayout, recordBetResult, triggerConfetti, unlockAchievement]);

  // Cashout action for Panel 2
  const cashOutPanel2 = useCallback(() => {
    if (gameState !== 'FLYING' || !panel2.isBetPlaced || panel2.isCashedOut) return;
    const curMult = currentMultiplierRef.current;
    const payout = Math.floor(panel2.betAmount * curMult);

    sounds.playCashout();
    if (curMult >= 5.0) {
      triggerConfetti();
      unlockAchievement('sky_high');
    }

    addPayout(payout, 'aviator');
    recordBetResult({
      game: 'aviator',
      gameTitle: 'Aviator Flight (Panel 2)',
      betAmount: panel2.betAmount,
      multiplier: curMult,
      payout,
      resultText: `Cashed out at ${curMult.toFixed(2)}x`,
      won: true,
    });

    setPanel2((prev) => ({
      ...prev,
      isCashedOut: true,
      cashedOutMultiplier: curMult,
      cashedOutPayout: payout,
    }));
  }, [gameState, panel2.isBetPlaced, panel2.isCashedOut, panel2.betAmount, addPayout, recordBetResult, triggerConfetti, unlockAchievement]);

  // Place / cancel bet Panel 1
  const toggleBetPanel1 = () => {
    sounds.playClick();
    if (panel1.isBetPlaced) {
      // Cancel bet if still in countdown
      if (gameState === 'COUNTDOWN') {
        addPayout(panel1.betAmount, 'aviator');
        setPanel1((prev) => ({ ...prev, isBetPlaced: false }));
      }
    } else {
      if (panel1.betAmount > balance) return;
      if (placeBet(panel1.betAmount, 'aviator')) {
        unlockAchievement('first_flight');
        setPanel1((prev) => ({
          ...prev,
          isBetPlaced: true,
          isCashedOut: false,
          cashedOutMultiplier: 0,
          cashedOutPayout: 0,
        }));
      }
    }
  };

  // Place / cancel bet Panel 2
  const toggleBetPanel2 = () => {
    sounds.playClick();
    if (panel2.isBetPlaced) {
      if (gameState === 'COUNTDOWN') {
        addPayout(panel2.betAmount, 'aviator');
        setPanel2((prev) => ({ ...prev, isBetPlaced: false }));
      }
    } else {
      if (panel2.betAmount > balance) return;
      if (placeBet(panel2.betAmount, 'aviator')) {
        unlockAchievement('first_flight');
        setPanel2((prev) => ({
          ...prev,
          isBetPlaced: true,
          isCashedOut: false,
          cashedOutMultiplier: 0,
          cashedOutPayout: 0,
        }));
      }
    }
  };

  // Game loop cycle
  useEffect(() => {
    let countdownInterval: NodeJS.Timeout | null = null;

    if (gameState === 'COUNTDOWN') {
      initSimulatedPlayers();
      const localTargetPoint = generateCrashPoint();
      setCrashPoint(localTargetPoint);
      setMultiplier(1.00);
      const generatedClientSeed = 'skyplay_' + Math.random().toString(36).substring(2, 10);
      setRoundSeed({
        serverSeed: Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
        clientSeed: generatedClientSeed,
      });

      // Synchronize with Express backend server
      api.getAviatorRound(generatedClientSeed).then((res) => {
        if (res && res.crashMultiplier) {
          setCrashPoint(res.crashMultiplier);
          setRoundSeed({
            serverSeed: res.serverHash,
            clientSeed: res.clientSeed,
          });
        }
      }).catch(() => {});

      let remaining = 5.0;
      setCountdown(remaining);

      countdownInterval = setInterval(() => {
        remaining -= 0.1;
        if (remaining <= 0.05) {
          if (countdownInterval) clearInterval(countdownInterval);
          setCountdown(0);
          setGameState('FLYING');
          startTimeRef.current = performance.now();
          sounds.startAviatorFly(1.0);
        } else {
          setCountdown(parseFloat(remaining.toFixed(1)));
        }
      }, 100);
    }

    return () => {
      if (countdownInterval) clearInterval(countdownInterval);
    };
  }, [gameState, generateCrashPoint, initSimulatedPlayers]);

  // Flying loop
  useEffect(() => {
    if (gameState !== 'FLYING') return;

    let isRunning = true;

    const tick = (now: number) => {
      if (!isRunning) return;
      const elapsedSec = (now - startTimeRef.current) / 1000;
      
      // Aviator exponential curve: grows steadily then accelerates
      const currentVal = parseFloat((1.00 + Math.pow(elapsedSec * 0.9, 1.45) * 0.55).toFixed(2));
      
      setMultiplier(currentVal);
      sounds.updateAviatorPitch(currentVal);

      // Check auto cashouts
      if (panel1.isBetPlaced && !panel1.isCashedOut && panel1.autoCashoutEnabled && currentVal >= panel1.autoCashoutMultiplier) {
        cashOutPanel1();
      }
      if (panel2.isBetPlaced && !panel2.isCashedOut && panel2.autoCashoutEnabled && currentVal >= panel2.autoCashoutMultiplier) {
        cashOutPanel2();
      }

      // Check simulated co-players cashout
      setSimulatedPlayers((prev) =>
        prev.map((bot) => {
          if (!bot.cashedOut && currentVal >= bot.targetMultiplier) {
            return { ...bot, cashedOut: true };
          }
          return bot;
        })
      );

      // Check crash condition
      if (currentVal >= crashPoint) {
        // Plane Crashes!
        isRunning = false;
        sounds.playAviatorCrash();
        setGameState('CRASHED');
        setMultiplier(crashPoint);

        // Record losses for active bets
        if (panel1.isBetPlaced && !panel1.isCashedOut) {
          recordBetResult({
            game: 'aviator',
            gameTitle: 'Aviator Flight',
            betAmount: panel1.betAmount,
            multiplier: 0,
            payout: 0,
            resultText: `Flew away at ${crashPoint.toFixed(2)}x`,
            won: false,
          });
        }
        if (panel2.isBetPlaced && !panel2.isCashedOut) {
          recordBetResult({
            game: 'aviator',
            gameTitle: 'Aviator Flight (Panel 2)',
            betAmount: panel2.betAmount,
            multiplier: 0,
            payout: 0,
            resultText: `Flew away at ${crashPoint.toFixed(2)}x`,
            won: false,
          });
        }

        // Add to history list
        setHistoryRounds((prev) => [crashPoint, ...prev.slice(0, 14)]);

        // Wait 3.5 seconds before starting next countdown
        setTimeout(() => {
          setPanel1((prev) => ({ ...prev, isBetPlaced: false, isCashedOut: false }));
          setPanel2((prev) => ({ ...prev, isBetPlaced: false, isCashedOut: false }));
          setGameState('COUNTDOWN');
        }, 3500);

        return;
      }

      animationFrameRef.current = requestAnimationFrame(tick);
    };

    animationFrameRef.current = requestAnimationFrame(tick);

    return () => {
      isRunning = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      sounds.stopAviatorFly();
    };
  }, [gameState, crashPoint, panel1, panel2, cashOutPanel1, cashOutPanel2, recordBetResult]);

  // HTML5 Canvas Flight Radar rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;

      // Clear dark cosmic background
      ctx.fillStyle = '#060a17';
      ctx.fillRect(0, 0, width, height);

      // Radar grid lines
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.08)';
      ctx.lineWidth = 1;

      // Horizontal grid lines
      const hLines = 6;
      for (let i = 1; i < hLines; i++) {
        const y = (height / hLines) * i;
        ctx.beginPath();
        ctx.moveTo(40, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Vertical grid lines
      const vLines = 8;
      for (let i = 1; i < vLines; i++) {
        const x = 40 + ((width - 40) / vLines) * i;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height - 30);
        ctx.stroke();
      }

      // Bottom and left axes
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.2)';
      ctx.beginPath();
      ctx.moveTo(40, 0);
      ctx.lineTo(40, height - 30);
      ctx.lineTo(width, height - 30);
      ctx.stroke();

      // Axis labels
      ctx.fillStyle = 'rgba(148, 163, 184, 0.5)';
      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.fillText('0s', 45, height - 12);
      ctx.fillText('5s', width * 0.35, height - 12);
      ctx.fillText('10s', width * 0.65, height - 12);
      ctx.fillText('15s+', width - 40, height - 12);

      ctx.fillText('1.0x', 8, height - 35);
      ctx.fillText('2.0x', 8, height * 0.65);
      ctx.fillText('5.0x', 8, height * 0.35);
      ctx.fillText('10x+', 8, 20);

      const startX = 40;
      const startY = height - 30;

      if (gameState === 'COUNTDOWN') {
        // Resting plane on runway
        drawPlane(ctx, startX + 30, startY - 15, 0, '#38bdf8');
      } else if (gameState === 'FLYING' || gameState === 'CRASHED') {
        // Multiplier progression curve
        const progress = Math.min(1.0, (multiplier - 1.0) / 10.0);
        const curveProgress = Math.pow(progress, 0.7);

        const currentX = startX + 40 + (width - 140) * curveProgress;
        const currentY = startY - 20 - (height - 90) * curveProgress;

        // Draw glowing gradient curve under flight trail
        const gradient = ctx.createLinearGradient(startX, startY, currentX, currentY);
        gradient.addColorStop(0, 'rgba(56, 189, 248, 0.0)');
        gradient.addColorStop(1, gameState === 'CRASHED' ? 'rgba(239, 68, 68, 0.25)' : 'rgba(236, 72, 153, 0.35)');

        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.quadraticCurveTo(startX + (currentX - startX) * 0.6, startY, currentX, currentY);
        ctx.lineTo(currentX, startY);
        ctx.closePath();
        ctx.fillStyle = gradient;
        ctx.fill();

        // Draw flight curve stroke
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.quadraticCurveTo(startX + (currentX - startX) * 0.6, startY, currentX, currentY);
        ctx.strokeStyle = gameState === 'CRASHED' ? '#ef4444' : '#ec4899';
        ctx.lineWidth = 3.5;
        ctx.shadowColor = gameState === 'CRASHED' ? '#ef4444' : '#ec4899';
        ctx.shadowBlur = 12;
        ctx.stroke();
        ctx.shadowBlur = 0; // reset

        // Draw the plane
        if (gameState === 'FLYING') {
          // Angle of plane based on trajectory
          const angle = -0.32;
          drawPlane(ctx, currentX, currentY, angle, '#f43f5e');

          // Jet engine thrust particles
          ctx.beginPath();
          ctx.arc(currentX - 25, currentY + 6, 4 + Math.random() * 3, 0, Math.PI * 2);
          ctx.fillStyle = Math.random() > 0.5 ? '#f59e0b' : '#38bdf8';
          ctx.fill();
        } else if (gameState === 'CRASHED') {
          // Explosion burst icon
          drawExplosion(ctx, currentX, currentY);
        }
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animId);
  }, [gameState, multiplier]);

  // Plane drawing helper on canvas
  const drawPlane = (ctx: CanvasRenderingContext2D, x: number, y: number, angle: number, color: string) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);

    // Fuselage
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(18, 0);
    ctx.lineTo(-14, -8);
    ctx.lineTo(-8, 0);
    ctx.lineTo(-14, 8);
    ctx.closePath();
    ctx.fill();

    // Wings
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(2, 0);
    ctx.lineTo(-8, -18);
    ctx.lineTo(-12, -18);
    ctx.lineTo(-4, 0);
    ctx.lineTo(-12, 18);
    ctx.lineTo(-8, 18);
    ctx.closePath();
    ctx.fill();

    // Cockpit glow
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(6, 0, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  };

  const drawExplosion = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
    ctx.save();
    ctx.translate(x, y);

    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI) / 4;
      const dist = 14 + Math.random() * 10;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(angle) * dist, Math.sin(angle) * dist);
      ctx.strokeStyle = i % 2 === 0 ? '#ef4444' : '#f59e0b';
      ctx.lineWidth = 2.5;
      ctx.stroke();
    }

    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(0, 0, 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  };

  // Helper for quick bet amounts
  const setQuickBet = (panelNum: 1 | 2, val: number) => {
    sounds.playClick();
    if (panelNum === 1) {
      setPanel1((prev) => ({ ...prev, betAmount: Math.min(balance || 10000, Math.max(10, val)) }));
    } else {
      setPanel2((prev) => ({ ...prev, betAmount: Math.min(balance || 10000, Math.max(10, val)) }));
    }
  };

  const multiplyBet = (panelNum: 1 | 2, mult: number) => {
    sounds.playClick();
    if (panelNum === 1) {
      setPanel1((prev) => ({ ...prev, betAmount: Math.min(balance || 10000, Math.max(10, Math.round(prev.betAmount * mult))) }));
    } else {
      setPanel2((prev) => ({ ...prev, betAmount: Math.min(balance || 10000, Math.max(10, Math.round(prev.betAmount * mult))) }));
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Banner / Past Multipliers */}
      <div className="flex items-center justify-between gap-4 glass-panel p-2.5 rounded-xl border border-slate-800">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 shrink-0">
          <Clock className="w-3.5 h-3.5 text-cyan-400" />
          <span>Recent Flights:</span>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
          {historyRounds.map((round, idx) => {
            const isHigh = round >= 10.0;
            const isMid = round >= 2.0 && round < 10.0;
            return (
              <span
                key={idx}
                className={`text-xs px-2.5 py-1 rounded-md font-tabular font-bold tracking-tight shrink-0 transition-transform ${
                  isHigh
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 glow-gold'
                    : isMid
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30 glow-purple'
                    : 'bg-cyan-950/60 text-cyan-400 border border-cyan-800/40'
                }`}
              >
                {round.toFixed(2)}x
              </span>
            );
          })}
        </div>
        <button
          onClick={() => setShowFairModal(true)}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-cyan-300 px-2.5 py-1 rounded-md border border-slate-800 hover:border-cyan-800/60 transition-colors shrink-0"
          title="Provably Fair verification algorithm"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden sm:inline">Provably Fair</span>
        </button>
      </div>

      {/* Main Arena: Flight Radar Viewport + Live Co-players List */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Radar Canvas (3 cols) */}
        <div className="lg:col-span-3 relative h-[380px] sm:h-[440px] rounded-2xl overflow-hidden glass-panel border border-slate-800/80 shadow-2xl flex flex-col justify-center items-center">
          {/* HTML5 Canvas */}
          <canvas
            ref={canvasRef}
            width={800}
            height={440}
            className="absolute inset-0 w-full h-full object-cover"
          />

          {/* Central Overlay: Multiplier / Status display */}
          <div className="relative z-10 text-center select-none pointer-events-none px-4">
            {gameState === 'COUNTDOWN' && (
              <div className="space-y-2 animate-in fade-in zoom-in-95 duration-200">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/30 text-cyan-300 text-xs uppercase tracking-wider font-semibold">
                  <Plane className="w-3.5 h-3.5 animate-pulse text-cyan-400" />
                  Takeoff Imminent
                </div>
                <div className="text-4xl sm:text-6xl font-black font-tabular text-white tracking-tight drop-shadow-lg">
                  {countdown.toFixed(1)}s
                </div>
                <div className="w-48 h-2 bg-slate-900/80 rounded-full mx-auto overflow-hidden border border-slate-700/50">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 to-rose-500 transition-all duration-100 ease-linear"
                    style={{ width: `${(countdown / 5.0) * 100}%` }}
                  />
                </div>
                <p className="text-xs text-slate-400">Place bets for next round</p>
              </div>
            )}

            {gameState === 'FLYING' && (
              <div className="space-y-1">
                <div className="text-5xl sm:text-7xl md:text-8xl font-black font-tabular tracking-tight bg-gradient-to-b from-white via-slate-100 to-rose-200 bg-clip-text text-transparent drop-shadow-[0_10px_25px_rgba(244,63,94,0.4)]">
                  {multiplier.toFixed(2)}x
                </div>
                <div className="inline-flex items-center gap-1.5 text-xs text-rose-300/90 font-medium">
                  <TrendingUp className="w-3.5 h-3.5 animate-bounce" />
                  Ascending Supersonic
                </div>
              </div>
            )}

            {gameState === 'CRASHED' && (
              <div className="space-y-2 animate-in zoom-in-90 duration-150">
                <div className="text-sm uppercase tracking-widest text-rose-400 font-bold">
                  Flew Away!
                </div>
                <div className="text-5xl sm:text-7xl font-black font-tabular text-rose-500 drop-shadow-[0_0_35px_rgba(239,68,68,0.6)]">
                  {multiplier.toFixed(2)}x
                </div>
                <p className="text-xs text-slate-400">Preparing next flight trajectory...</p>
              </div>
            )}
          </div>

          {/* Bottom Live Status Bar */}
          <div className="absolute bottom-3 left-4 right-4 z-10 flex items-center justify-between text-xs text-slate-400 bg-slate-950/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-800">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Simulated Round #{historyRounds.length + 1042}</span>
            </span>
            <span className="text-slate-400 font-mono">100% Virtual Entertainment</span>
          </div>
        </div>

        {/* Live Co-players list (1 col) */}
        <div className="glass-panel rounded-2xl border border-slate-800 p-4 flex flex-col h-[380px] sm:h-[440px]">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
              <Users className="w-4 h-4 text-cyan-400" />
              <span>Simulated Bets ({simulatedPlayers.length + (panel1.isBetPlaced ? 1 : 0) + (panel2.isBetPlaced ? 1 : 0)})</span>
            </div>
            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Live Feed</span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pt-3 pr-1">
            {/* User Bet 1 */}
            {panel1.isBetPlaced && (
              <div className="flex items-center justify-between p-2 rounded-lg bg-cyan-950/40 border border-cyan-800/40 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-cyan-500/20 border border-cyan-400 flex items-center justify-center text-[10px] font-bold text-cyan-300">
                    YOU
                  </div>
                  <div>
                    <div className="font-semibold text-slate-200">Panel 1</div>
                    <div className="text-[10px] text-slate-400 font-tabular">{panel1.betAmount} SC</div>
                  </div>
                </div>
                {panel1.isCashedOut ? (
                  <div className="text-right">
                    <div className="text-emerald-400 font-bold font-tabular">+{panel1.cashedOutPayout} SC</div>
                    <div className="text-[10px] text-emerald-300/80">{panel1.cashedOutMultiplier.toFixed(2)}x</div>
                  </div>
                ) : gameState === 'FLYING' ? (
                  <span className="text-cyan-400 animate-pulse text-[11px] font-medium">Flying...</span>
                ) : (
                  <span className="text-slate-400 text-[11px]">Ready</span>
                )}
              </div>
            )}

            {/* User Bet 2 */}
            {panel2.isBetPlaced && (
              <div className="flex items-center justify-between p-2 rounded-lg bg-purple-950/40 border border-purple-800/40 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-purple-500/20 border border-purple-400 flex items-center justify-center text-[10px] font-bold text-purple-300">
                    YOU
                  </div>
                  <div>
                    <div className="font-semibold text-slate-200">Panel 2</div>
                    <div className="text-[10px] text-slate-400 font-tabular">{panel2.betAmount} SC</div>
                  </div>
                </div>
                {panel2.isCashedOut ? (
                  <div className="text-right">
                    <div className="text-emerald-400 font-bold font-tabular">+{panel2.cashedOutPayout} SC</div>
                    <div className="text-[10px] text-emerald-300/80">{panel2.cashedOutMultiplier.toFixed(2)}x</div>
                  </div>
                ) : gameState === 'FLYING' ? (
                  <span className="text-purple-400 animate-pulse text-[11px] font-medium">Flying...</span>
                ) : (
                  <span className="text-slate-400 text-[11px]">Ready</span>
                )}
              </div>
            )}

            {/* Simulated Bots */}
            {simulatedPlayers.map((player) => (
              <div
                key={player.id}
                className="flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-900/60 transition-colors text-xs"
              >
                <div className="flex items-center gap-2 truncate">
                  <img
                    src={player.avatar}
                    alt={player.name}
                    className="w-5 h-5 rounded-full bg-slate-800 shrink-0"
                    referrerPolicy="no-referrer"
                  />
                  <div className="truncate">
                    <div className="font-medium text-slate-300 truncate">{player.name}</div>
                    <div className="text-[10px] text-slate-500 font-tabular">{player.bet} SC</div>
                  </div>
                </div>

                {player.cashedOut ? (
                  <div className="text-right shrink-0">
                    <div className="text-emerald-400 font-bold font-tabular text-[11px]">
                      +{Math.floor(player.bet * player.targetMultiplier)} SC
                    </div>
                    <div className="text-[10px] text-slate-400">{player.targetMultiplier.toFixed(2)}x</div>
                  </div>
                ) : gameState === 'CRASHED' ? (
                  <span className="text-rose-400/80 text-[11px]">Busted</span>
                ) : (
                  <span className="text-slate-500 text-[11px]">In air</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Dual Betting Control Deck */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Bet Panel 1 */}
        <div className="glass-panel p-4 rounded-2xl border border-slate-800 space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5" />
              Primary Bet Panel
            </span>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1.5 cursor-pointer text-xs text-slate-400 hover:text-slate-200">
                <input
                  type="checkbox"
                  checked={panel1.autoCashoutEnabled}
                  onChange={(e) => setPanel1((p) => ({ ...p, autoCashoutEnabled: e.target.checked }))}
                  className="rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-0 w-3.5 h-3.5"
                />
                <span>Auto Cashout</span>
              </label>
              {panel1.autoCashoutEnabled && (
                <input
                  type="number"
                  step="0.1"
                  min="1.1"
                  max="100"
                  value={panel1.autoCashoutMultiplier}
                  onChange={(e) =>
                    setPanel1((p) => ({
                      ...p,
                      autoCashoutMultiplier: Math.max(1.1, parseFloat(e.target.value) || 1.1),
                    }))
                  }
                  className="w-16 px-2 py-0.5 rounded bg-slate-900 border border-cyan-800 text-xs font-tabular text-right text-cyan-300 focus:outline-none"
                />
              )}
            </div>
          </div>

          {/* Bet Amount Input & Quick Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <div className="relative">
                <input
                  type="number"
                  min="10"
                  max="50000"
                  disabled={panel1.isBetPlaced && gameState === 'FLYING'}
                  value={panel1.betAmount}
                  onChange={(e) =>
                    setPanel1((p) => ({ ...p, betAmount: Math.max(10, parseInt(e.target.value) || 10) }))
                  }
                  className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl px-3 py-2.5 text-base font-bold font-tabular text-white focus:outline-none focus:border-cyan-500 pl-8"
                />
                <Coins className="w-4 h-4 text-amber-400 absolute left-2.5 top-3.5" />
                <span className="absolute right-3 top-3 text-xs text-slate-400 font-semibold">SC</span>
              </div>
              <div className="flex gap-1">
                {[100, 250, 500, 1000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setQuickBet(1, amt)}
                    disabled={panel1.isBetPlaced && gameState === 'FLYING'}
                    className="flex-1 py-1 rounded bg-slate-900 hover:bg-slate-800 text-[11px] font-medium text-slate-300 border border-slate-800 transition-colors"
                  >
                    +{amt}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => multiplyBet(1, 2)}
                  disabled={panel1.isBetPlaced && gameState === 'FLYING'}
                  className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-[11px] font-bold text-cyan-400 border border-slate-800"
                >
                  2X
                </button>
                <button
                  type="button"
                  onClick={() => multiplyBet(1, 0.5)}
                  disabled={panel1.isBetPlaced && gameState === 'FLYING'}
                  className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-[11px] font-bold text-slate-400 border border-slate-800"
                >
                  ½
                </button>
              </div>
            </div>

            {/* Action Button: BET or CASHOUT */}
            <div>
              {gameState === 'FLYING' && panel1.isBetPlaced && !panel1.isCashedOut ? (
                <button
                  type="button"
                  onClick={cashOutPanel1}
                  className="w-full h-full min-h-[58px] rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-black text-lg shadow-lg glow-gold active:scale-98 transition-all flex flex-col items-center justify-center p-2"
                >
                  <span>CASH OUT</span>
                  <span className="text-xs font-bold font-tabular text-slate-900">
                    +{Math.floor(panel1.betAmount * multiplier).toLocaleString()} SC ({multiplier.toFixed(2)}x)
                  </span>
                </button>
              ) : panel1.isBetPlaced ? (
                <button
                  type="button"
                  onClick={toggleBetPanel1}
                  disabled={gameState === 'FLYING'}
                  className="w-full h-full min-h-[58px] rounded-xl bg-rose-600/80 hover:bg-rose-700 text-white font-bold text-sm border border-rose-500 transition-colors flex flex-col items-center justify-center p-2"
                >
                  <span>CANCEL BET</span>
                  <span className="text-[11px] text-rose-200">Waiting for takeoff...</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={toggleBetPanel1}
                  disabled={balance < panel1.betAmount}
                  className="w-full h-full min-h-[58px] rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 disabled:opacity-50 disabled:pointer-events-none text-slate-950 font-black text-lg shadow-lg active:scale-98 transition-all flex flex-col items-center justify-center p-2"
                >
                  <span>BET</span>
                  <span className="text-xs font-bold font-tabular text-emerald-950">
                    {panel1.betAmount.toLocaleString()} SC
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Bet Panel 2 */}
        <div className="glass-panel p-4 rounded-2xl border border-slate-800 space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5" />
              Secondary Bet Panel
            </span>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1.5 cursor-pointer text-xs text-slate-400 hover:text-slate-200">
                <input
                  type="checkbox"
                  checked={panel2.autoCashoutEnabled}
                  onChange={(e) => setPanel2((p) => ({ ...p, autoCashoutEnabled: e.target.checked }))}
                  className="rounded border-slate-700 bg-slate-900 text-purple-500 focus:ring-0 w-3.5 h-3.5"
                />
                <span>Auto Cashout</span>
              </label>
              {panel2.autoCashoutEnabled && (
                <input
                  type="number"
                  step="0.1"
                  min="1.1"
                  max="100"
                  value={panel2.autoCashoutMultiplier}
                  onChange={(e) =>
                    setPanel2((p) => ({
                      ...p,
                      autoCashoutMultiplier: Math.max(1.1, parseFloat(e.target.value) || 1.1),
                    }))
                  }
                  className="w-16 px-2 py-0.5 rounded bg-slate-900 border border-purple-800 text-xs font-tabular text-right text-purple-300 focus:outline-none"
                />
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <div className="relative">
                <input
                  type="number"
                  min="10"
                  max="50000"
                  disabled={panel2.isBetPlaced && gameState === 'FLYING'}
                  value={panel2.betAmount}
                  onChange={(e) =>
                    setPanel2((p) => ({ ...p, betAmount: Math.max(10, parseInt(e.target.value) || 10) }))
                  }
                  className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl px-3 py-2.5 text-base font-bold font-tabular text-white focus:outline-none focus:border-purple-500 pl-8"
                />
                <Coins className="w-4 h-4 text-amber-400 absolute left-2.5 top-3.5" />
                <span className="absolute right-3 top-3 text-xs text-slate-400 font-semibold">SC</span>
              </div>
              <div className="flex gap-1">
                {[100, 250, 500, 1000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setQuickBet(2, amt)}
                    disabled={panel2.isBetPlaced && gameState === 'FLYING'}
                    className="flex-1 py-1 rounded bg-slate-900 hover:bg-slate-800 text-[11px] font-medium text-slate-300 border border-slate-800 transition-colors"
                  >
                    +{amt}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => multiplyBet(2, 2)}
                  disabled={panel2.isBetPlaced && gameState === 'FLYING'}
                  className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-[11px] font-bold text-purple-400 border border-slate-800"
                >
                  2X
                </button>
                <button
                  type="button"
                  onClick={() => multiplyBet(2, 0.5)}
                  disabled={panel2.isBetPlaced && gameState === 'FLYING'}
                  className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-[11px] font-bold text-slate-400 border border-slate-800"
                >
                  ½
                </button>
              </div>
            </div>

            <div>
              {gameState === 'FLYING' && panel2.isBetPlaced && !panel2.isCashedOut ? (
                <button
                  type="button"
                  onClick={cashOutPanel2}
                  className="w-full h-full min-h-[58px] rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-black text-lg shadow-lg glow-gold active:scale-98 transition-all flex flex-col items-center justify-center p-2"
                >
                  <span>CASH OUT</span>
                  <span className="text-xs font-bold font-tabular text-slate-900">
                    +{Math.floor(panel2.betAmount * multiplier).toLocaleString()} SC ({multiplier.toFixed(2)}x)
                  </span>
                </button>
              ) : panel2.isBetPlaced ? (
                <button
                  type="button"
                  onClick={toggleBetPanel2}
                  disabled={gameState === 'FLYING'}
                  className="w-full h-full min-h-[58px] rounded-xl bg-rose-600/80 hover:bg-rose-700 text-white font-bold text-sm border border-rose-500 transition-colors flex flex-col items-center justify-center p-2"
                >
                  <span>CANCEL BET</span>
                  <span className="text-[11px] text-rose-200">Waiting for takeoff...</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={toggleBetPanel2}
                  disabled={balance < panel2.betAmount}
                  className="w-full h-full min-h-[58px] rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 disabled:opacity-50 disabled:pointer-events-none text-white font-black text-lg shadow-lg active:scale-98 transition-all flex flex-col items-center justify-center p-2"
                >
                  <span>BET</span>
                  <span className="text-xs font-bold font-tabular text-purple-200">
                    {panel2.betAmount.toLocaleString()} SC
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Simulated Fair Modal */}
      {showFairModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="glass-panel p-6 rounded-2xl max-w-md w-full border border-cyan-800/60 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2 text-cyan-400 font-bold">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <span>Provably Fair Verification</span>
              </div>
              <button
                onClick={() => setShowFairModal(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Every round outcome in SkyPlay Aviator is generated using a simulated cryptographic SHA-256 hash combination of the server seed and client seed, ensuring transparent, immutable, and predetermined flight crash points.
            </p>
            <div className="space-y-2 text-xs font-mono">
              <div>
                <span className="text-slate-400">Server Seed Hash:</span>
                <div className="bg-slate-900 p-2 rounded text-[11px] text-cyan-300 break-all border border-slate-800">
                  {roundSeed.serverSeed}
                </div>
              </div>
              <div>
                <span className="text-slate-400">Client Seed:</span>
                <div className="bg-slate-900 p-2 rounded text-[11px] text-purple-300 break-all border border-slate-800">
                  {roundSeed.clientSeed}
                </div>
              </div>
            </div>
            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowFairModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-lg text-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
