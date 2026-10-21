import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useGame } from '../context/GameContext';
import { sounds } from '../services/sound';
import { RotateCw, Trash2, Repeat, Zap, Award, Sparkles } from 'lucide-react';

// European Roulette Wheel Number Sequence
const ROULETTE_NUMBERS = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10,
  5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26
];

const RED_NUMBERS = new Set([
  1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36
]);

const CHIP_VALUES = [25, 100, 250, 500, 1000, 2500];

type BetType =
  | 'straight'
  | 'red'
  | 'black'
  | 'even'
  | 'odd'
  | 'low'
  | 'high'
  | 'dozen1'
  | 'dozen2'
  | 'dozen3'
  | 'col1'
  | 'col2'
  | 'col3';

interface PlacedBet {
  key: string;
  type: BetType;
  value?: number; // For straight bets (0-36)
  amount: number;
}

export const RouletteGame: React.FC = () => {
  const { balance, placeBet, addPayout, recordBetResult, unlockAchievement, triggerConfetti } = useGame();

  const [selectedChip, setSelectedChip] = useState<number>(100);
  const [currentBets, setCurrentBets] = useState<Record<string, PlacedBet>>({});
  const [previousBets, setPreviousBets] = useState<Record<string, PlacedBet>>({});
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [winningNumber, setWinningNumber] = useState<number | null>(null);
  const [winNotification, setWinNotification] = useState<{ amount: number; text: string } | null>(null);
  const [recentWinners, setRecentWinners] = useState<number[]>([17, 0, 32, 15, 29, 8, 22]);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wheelAngleRef = useRef<number>(0);
  const ballAngleRef = useRef<number>(0);

  const totalBetAmount: number = (Object.values(currentBets) as PlacedBet[]).reduce(
    (acc: number, b: PlacedBet) => acc + b.amount,
    0
  );

  const getNumberColor = (num: number): 'green' | 'red' | 'black' => {
    if (num === 0) return 'green';
    return RED_NUMBERS.has(num) ? 'red' : 'black';
  };

  // Add a bet to a specific pocket / sector
  const addBet = (key: string, type: BetType, value?: number) => {
    if (isSpinning) return;
    if (balance < selectedChip) return;

    sounds.playChip();
    setCurrentBets((prev) => {
      const existing = prev[key];
      const newAmount = (existing ? existing.amount : 0) + selectedChip;
      return {
        ...prev,
        [key]: {
          key,
          type,
          value,
          amount: newAmount,
        },
      };
    });
  };

  const clearBets = () => {
    if (isSpinning) return;
    sounds.playClick();
    setCurrentBets({});
  };

  const doubleBets = () => {
    if (isSpinning) return;
    sounds.playChip();
    setCurrentBets((prev) => {
      const doubled: Record<string, PlacedBet> = {};
      for (const k in prev) {
        doubled[k] = { ...prev[k], amount: prev[k].amount * 2 };
      }
      return doubled;
    });
  };

  const repeatBets = () => {
    if (isSpinning) return;
    sounds.playChip();
    setCurrentBets({ ...previousBets });
  };

  // Spin Roulette Wheel
  const spinWheel = useCallback(() => {
    if (isSpinning || totalBetAmount <= 0) return;
    if (balance < totalBetAmount) return;

    if (!placeBet(totalBetAmount, 'roulette')) return;

    sounds.playClick();
    setIsSpinning(true);
    setWinningNumber(null);
    setWinNotification(null);
    setPreviousBets({ ...currentBets });

    // Pick winning number randomly
    const targetIdx = Math.floor(Math.random() * ROULETTE_NUMBERS.length);
    const targetNumber = ROULETTE_NUMBERS[targetIdx];

    // Angular math for European wheel
    const sliceAngle = (2 * Math.PI) / ROULETTE_NUMBERS.length;
    const targetAngle = targetIdx * sliceAngle;
    const totalWheelSpins = 4 * 2 * Math.PI;
    const totalBallSpins = 7 * 2 * Math.PI;

    const startWheelAngle = wheelAngleRef.current % (2 * Math.PI);
    const startBallAngle = ballAngleRef.current % (2 * Math.PI);

    const endWheelAngle = startWheelAngle + totalWheelSpins + (2 * Math.PI - targetAngle);
    const endBallAngle = startBallAngle - totalBallSpins - targetAngle;

    const duration = 4000;
    const startTime = performance.now();
    let lastTickAngle = 0;

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1.0, elapsed / duration);
      // Smooth quintic ease out for casino deceleration
      const ease = 1 - Math.pow(1 - progress, 4);

      wheelAngleRef.current = startWheelAngle + (endWheelAngle - startWheelAngle) * ease;
      ballAngleRef.current = startBallAngle + (endBallAngle - startBallAngle) * ease;

      // Play tick sounds on ball pass
      if (Math.abs(ballAngleRef.current - lastTickAngle) > sliceAngle * 0.8) {
        sounds.playRouletteTick(800 + Math.random() * 200);
        lastTickAngle = ballAngleRef.current;
      }

      drawRoulette(wheelAngleRef.current, ballAngleRef.current, progress >= 1.0 ? targetNumber : null);

      if (progress < 1.0) {
        requestAnimationFrame(animate);
      } else {
        // Spin finished!
        setIsSpinning(false);
        setWinningNumber(targetNumber);
        setRecentWinners((prev) => [targetNumber, ...prev.slice(0, 11)]);

        // Calculate Payouts
        let totalWin = 0;
        const color = getNumberColor(targetNumber);
        const isEven = targetNumber !== 0 && targetNumber % 2 === 0;
        const isOdd = targetNumber !== 0 && targetNumber % 2 !== 0;
        const isLow = targetNumber >= 1 && targetNumber <= 18;
        const isHigh = targetNumber >= 19 && targetNumber <= 36;
        const dozen = targetNumber === 0 ? 0 : Math.ceil(targetNumber / 12);
        const col = targetNumber === 0 ? 0 : ((targetNumber - 1) % 3) + 1;

        Object.values(currentBets).forEach((b) => {
          if (b.type === 'straight' && b.value === targetNumber) {
            totalWin += b.amount * 36; // 35:1 + original
            if (targetNumber === 0) unlockAchievement('roulette_hit');
          } else if (b.type === 'red' && color === 'red') {
            totalWin += b.amount * 2;
          } else if (b.type === 'black' && color === 'black') {
            totalWin += b.amount * 2;
          } else if (b.type === 'even' && isEven) {
            totalWin += b.amount * 2;
          } else if (b.type === 'odd' && isOdd) {
            totalWin += b.amount * 2;
          } else if (b.type === 'low' && isLow) {
            totalWin += b.amount * 2;
          } else if (b.type === 'high' && isHigh) {
            totalWin += b.amount * 2;
          } else if (b.type === `dozen${dozen}`) {
            totalWin += b.amount * 3;
          } else if (b.type === `col${col}`) {
            totalWin += b.amount * 3;
          }
        });

        if (totalWin > 0) {
          sounds.playCashout();
          triggerConfetti();
          addPayout(totalWin, 'roulette');
          setWinNotification({
            amount: totalWin,
            text: `Winning Number: ${targetNumber} (${color.toUpperCase()}) — You Won ${totalWin.toLocaleString()} SC!`,
          });
        } else {
          setWinNotification({
            amount: 0,
            text: `Winning Number: ${targetNumber} (${color.toUpperCase()}) — Better luck next spin!`,
          });
        }

        recordBetResult({
          game: 'roulette',
          gameTitle: 'Space Roulette',
          betAmount: totalBetAmount,
          multiplier: totalWin > 0 ? parseFloat((totalWin / totalBetAmount).toFixed(2)) : 0,
          payout: totalWin,
          resultText: `Landed on ${targetNumber} (${color})`,
          won: totalWin > 0,
        });

        setCurrentBets({});
      }
    };

    requestAnimationFrame(animate);
  }, [
    isSpinning,
    totalBetAmount,
    balance,
    placeBet,
    currentBets,
    addPayout,
    recordBetResult,
    triggerConfetti,
    unlockAchievement,
  ]);

  // Canvas drawing for European Space Roulette Wheel
  const drawRoulette = (wAngle: number, bAngle: number, settledNum: number | null) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = canvas.width;
    const center = size / 2;
    const radius = size * 0.46;

    ctx.clearRect(0, 0, size, size);

    // Outer cybernetic rim with neon glows
    ctx.save();
    ctx.translate(center, center);

    // Glowing border ring
    ctx.beginPath();
    ctx.arc(0, 0, radius + 8, 0, Math.PI * 2);
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 15;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Outer wooden/obsidian track
    const trackGrad = ctx.createRadialGradient(0, 0, radius * 0.75, 0, 0, radius);
    trackGrad.addColorStop(0, '#0f172a');
    trackGrad.addColorStop(0.8, '#1e293b');
    trackGrad.addColorStop(1, '#020617');
    ctx.fillStyle = trackGrad;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fill();

    // Wheel rotating surface
    ctx.rotate(wAngle);

    const sliceAngle = (2 * Math.PI) / ROULETTE_NUMBERS.length;

    ROULETTE_NUMBERS.forEach((num, i) => {
      const angle = i * sliceAngle;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, radius * 0.88, angle, angle + sliceAngle);
      ctx.closePath();

      // Pocket colors
      if (num === 0) {
        ctx.fillStyle = '#059669'; // Green 0
      } else if (RED_NUMBERS.has(num)) {
        ctx.fillStyle = '#dc2626'; // Red
      } else {
        ctx.fillStyle = '#090d16'; // Deep Black
      }
      ctx.fill();

      // Hairline pocket divider
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Number text
      ctx.save();
      ctx.rotate(angle + sliceAngle / 2);
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 11px "Outfit", sans-serif';
      ctx.fillText(num.toString(), radius * 0.82, 0);
      ctx.restore();
    });

    // Center Gold Turret / Hub
    const hubGrad = ctx.createRadialGradient(0, 0, 5, 0, 0, radius * 0.4);
    hubGrad.addColorStop(0, '#fef08a');
    hubGrad.addColorStop(0.5, '#d97706');
    hubGrad.addColorStop(1, '#78350f');

    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.35, 0, Math.PI * 2);
    ctx.fillStyle = hubGrad;
    ctx.fill();
    ctx.strokeStyle = '#fef08a';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Center jewel / logo
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.16, 0, Math.PI * 2);
    ctx.fillStyle = '#0f172a';
    ctx.fill();
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 12px "Outfit", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('SKY', 0, 0);

    ctx.restore();

    // Draw Ivory Ball
    ctx.save();
    ctx.translate(center, center);

    const ballDist = settledNum !== null ? radius * 0.76 : radius * 0.86;
    const bx = Math.cos(bAngle) * ballDist;
    const by = Math.sin(bAngle) * ballDist;

    ctx.beginPath();
    ctx.arc(bx, by, 7.5, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 10;
    ctx.fill();

    // Ball specular highlight
    ctx.beginPath();
    ctx.arc(bx - 2, by - 2, 2.5, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.fill();

    ctx.restore();
  };

  useEffect(() => {
    drawRoulette(wheelAngleRef.current, ballAngleRef.current, winningNumber);
  }, [winningNumber]);

  return (
    <div className="space-y-4">
      {/* Recent Numbers Strip */}
      <div className="flex items-center justify-between glass-panel p-2.5 rounded-xl border border-slate-800">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
          <RotateCw className="w-3.5 h-3.5 text-purple-400" />
          <span>Last Outcomes:</span>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          {recentWinners.map((num, i) => {
            const color = getNumberColor(num);
            return (
              <span
                key={i}
                className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs font-tabular shrink-0 border ${
                  color === 'green'
                    ? 'bg-emerald-600 text-white border-emerald-400'
                    : color === 'red'
                    ? 'bg-rose-600 text-white border-rose-400'
                    : 'bg-slate-900 text-slate-200 border-slate-700'
                }`}
              >
                {num}
              </span>
            );
          })}
        </div>
      </div>

      {/* Main Roulette Layout: Wheel + Betting Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Animated Wheel Viewport (5 cols) */}
        <div className="lg:col-span-5 glass-panel p-4 rounded-2xl border border-slate-800 flex flex-col items-center justify-center relative overflow-hidden">
          <div className="relative w-full max-w-[340px] aspect-square flex items-center justify-center">
            <canvas
              ref={canvasRef}
              width={340}
              height={340}
              className="w-full h-full object-contain"
            />
          </div>

          {/* Outcome Badge */}
          {winningNumber !== null && (
            <div className="mt-3 text-center animate-in zoom-in-95 duration-200">
              <span
                className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full font-black text-sm tracking-wide ${
                  getNumberColor(winningNumber) === 'green'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : getNumberColor(winningNumber) === 'red'
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    : 'bg-slate-800 text-white border border-slate-600'
                }`}
              >
                <span>RESULT: {winningNumber}</span>
                <span className="text-xs uppercase opacity-80">({getNumberColor(winningNumber)})</span>
              </span>
            </div>
          )}

          {winNotification && (
            <div
              className={`mt-2 text-xs font-semibold px-3 py-1.5 rounded-lg border text-center ${
                winNotification.amount > 0
                  ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300'
                  : 'bg-slate-900/80 border-slate-800 text-slate-400'
              }`}
            >
              {winNotification.text}
            </div>
          )}
        </div>

        {/* Roulette Betting Table (7 cols) */}
        <div className="lg:col-span-7 glass-panel p-4 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Orbital Felt Board
            </span>
            <div className="text-xs font-tabular text-slate-300">
              Total Bet:{' '}
              <span className="font-bold text-amber-400">{totalBetAmount.toLocaleString()} SC</span>
            </div>
          </div>

          {/* European Grid Table Layout */}
          <div className="overflow-x-auto pb-2">
            <div className="min-w-[480px] bg-slate-950/70 p-3 rounded-xl border border-slate-800 space-y-2 select-none">
              {/* Top row: 0 pocket (spans left) */}
              <div className="grid grid-cols-13 gap-1">
                <button
                  type="button"
                  onClick={() => addBet('num_0', 'straight', 0)}
                  disabled={isSpinning}
                  className="row-span-3 col-span-1 bg-emerald-700/80 hover:bg-emerald-600 text-white font-bold rounded-lg flex flex-col items-center justify-center p-1 relative text-sm border border-emerald-500/40 transition-colors"
                >
                  <span>0</span>
                  {currentBets['num_0'] && (
                    <span className="absolute bottom-1 px-1 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black">
                      {currentBets['num_0'].amount}
                    </span>
                  )}
                </button>

                {/* 36 Numbers Grid in 3 rows (Row 1: 3, 6, 9... 36; Row 2: 2, 5... 35; Row 3: 1, 4... 34) */}
                {[
                  [3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36],
                  [2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35],
                  [1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34],
                ].map((row, rowIdx) => (
                  <React.Fragment key={rowIdx}>
                    {row.map((num) => {
                      const isRed = RED_NUMBERS.has(num);
                      const key = `num_${num}`;
                      const hasBet = currentBets[key];
                      return (
                        <button
                          key={num}
                          type="button"
                          onClick={() => addBet(key, 'straight', num)}
                          disabled={isSpinning}
                          className={`h-10 rounded-md font-bold text-xs flex flex-col items-center justify-center relative border transition-transform active:scale-95 ${
                            isRed
                              ? 'bg-rose-700/80 hover:bg-rose-600 text-white border-rose-500/30'
                              : 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-700/50'
                          }`}
                        >
                          <span>{num}</span>
                          {hasBet && (
                            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-400 text-slate-950 text-[9px] font-black flex items-center justify-center shadow">
                              •
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </React.Fragment>
                ))}
              </div>

              {/* Columns Payouts (2:1) */}
              <div className="grid grid-cols-13 gap-1 text-[11px] font-bold">
                <div className="col-span-1" />
                <button
                  type="button"
                  onClick={() => addBet('col1', 'col1')}
                  disabled={isSpinning}
                  className="col-span-4 py-1.5 rounded bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-slate-800 relative"
                >
                  <span>Col 1 (2:1)</span>
                  {currentBets['col1'] && (
                    <span className="ml-1 text-amber-400">({currentBets['col1'].amount})</span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => addBet('col2', 'col2')}
                  disabled={isSpinning}
                  className="col-span-4 py-1.5 rounded bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-slate-800 relative"
                >
                  <span>Col 2 (2:1)</span>
                  {currentBets['col2'] && (
                    <span className="ml-1 text-amber-400">({currentBets['col2'].amount})</span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => addBet('col3', 'col3')}
                  disabled={isSpinning}
                  className="col-span-4 py-1.5 rounded bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-slate-800 relative"
                >
                  <span>Col 3 (2:1)</span>
                  {currentBets['col3'] && (
                    <span className="ml-1 text-amber-400">({currentBets['col3'].amount})</span>
                  )}
                </button>
              </div>

              {/* Dozens (1st 12, 2nd 12, 3rd 12 - pays 2:1) */}
              <div className="grid grid-cols-13 gap-1 text-xs font-bold">
                <div className="col-span-1" />
                <button
                  type="button"
                  onClick={() => addBet('dozen1', 'dozen1')}
                  disabled={isSpinning}
                  className="col-span-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-purple-300 border border-slate-800"
                >
                  1st 12 (1-12) {currentBets['dozen1'] && `(${currentBets['dozen1'].amount})`}
                </button>
                <button
                  type="button"
                  onClick={() => addBet('dozen2', 'dozen2')}
                  disabled={isSpinning}
                  className="col-span-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-purple-300 border border-slate-800"
                >
                  2nd 12 (13-24) {currentBets['dozen2'] && `(${currentBets['dozen2'].amount})`}
                </button>
                <button
                  type="button"
                  onClick={() => addBet('dozen3', 'dozen3')}
                  disabled={isSpinning}
                  className="col-span-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-purple-300 border border-slate-800"
                >
                  3rd 12 (25-36) {currentBets['dozen3'] && `(${currentBets['dozen3'].amount})`}
                </button>
              </div>

              {/* Outside Bets (1-18, Even, Red, Black, Odd, 19-36 - pays 1:1) */}
              <div className="grid grid-cols-6 gap-1 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => addBet('low', 'low')}
                  disabled={isSpinning}
                  className="py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800"
                >
                  1 to 18 {currentBets['low'] && `(${currentBets['low'].amount})`}
                </button>
                <button
                  type="button"
                  onClick={() => addBet('even', 'even')}
                  disabled={isSpinning}
                  className="py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800"
                >
                  EVEN {currentBets['even'] && `(${currentBets['even'].amount})`}
                </button>
                <button
                  type="button"
                  onClick={() => addBet('red', 'red')}
                  disabled={isSpinning}
                  className="py-2 rounded-lg bg-rose-700/80 hover:bg-rose-600 text-white border border-rose-600/50"
                >
                  RED {currentBets['red'] && `(${currentBets['red'].amount})`}
                </button>
                <button
                  type="button"
                  onClick={() => addBet('black', 'black')}
                  disabled={isSpinning}
                  className="py-2 rounded-lg bg-slate-950 hover:bg-slate-900 text-slate-200 border border-slate-700"
                >
                  BLACK {currentBets['black'] && `(${currentBets['black'].amount})`}
                </button>
                <button
                  type="button"
                  onClick={() => addBet('odd', 'odd')}
                  disabled={isSpinning}
                  className="py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800"
                >
                  ODD {currentBets['odd'] && `(${currentBets['odd'].amount})`}
                </button>
                <button
                  type="button"
                  onClick={() => addBet('high', 'high')}
                  disabled={isSpinning}
                  className="py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800"
                >
                  19 to 36 {currentBets['high'] && `(${currentBets['high'].amount})`}
                </button>
              </div>
            </div>
          </div>

          {/* Chip Value Selector */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800">
            <div className="flex items-center gap-1.5 overflow-x-auto py-1">
              {CHIP_VALUES.map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => {
                    sounds.playChip();
                    setSelectedChip(val);
                  }}
                  className={`w-11 h-11 rounded-full font-bold text-xs font-tabular flex items-center justify-center border-2 transition-all ${
                    selectedChip === val
                      ? 'border-amber-400 bg-amber-500/30 text-amber-300 scale-110 shadow-lg glow-gold'
                      : 'border-slate-700 bg-slate-900 text-slate-400 hover:border-slate-500'
                  }`}
                >
                  {val >= 1000 ? `${val / 1000}k` : val}
                </button>
              ))}
            </div>

            {/* Quick table controls: Clear, Double, Repeat */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={clearBets}
                disabled={isSpinning || totalBetAmount === 0}
                className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-rose-400 border border-slate-800 text-xs disabled:opacity-50"
                title="Clear all bets"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={doubleBets}
                disabled={isSpinning || totalBetAmount === 0}
                className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-semibold disabled:opacity-50"
                title="Double current bets"
              >
                2X
              </button>
              <button
                type="button"
                onClick={repeatBets}
                disabled={isSpinning || Object.keys(previousBets).length === 0}
                className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs disabled:opacity-50"
                title="Repeat previous bets"
              >
                <Repeat className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Action Spin Button */}
          <button
            type="button"
            onClick={spinWheel}
            disabled={isSpinning || totalBetAmount === 0 || balance < totalBetAmount}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 disabled:opacity-40 disabled:pointer-events-none text-white font-black text-lg tracking-wider shadow-xl glow-blue active:scale-98 transition-all flex items-center justify-center gap-2"
          >
            <RotateCw className={`w-5 h-5 ${isSpinning ? 'animate-spin' : ''}`} />
            <span>{isSpinning ? 'WHEEL IN MOTION...' : 'SPIN ROULETTE'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
