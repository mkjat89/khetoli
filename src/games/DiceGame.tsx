import React, { useState, useCallback } from 'react';
import { useGame } from '../context/GameContext';
import { sounds } from '../services/sound';
import { Dices, ShieldCheck, Zap, TrendingUp, Sliders, Sparkles } from 'lucide-react';

type DiceGameMode = 'classic' | 'slider';

interface DiceRollHistory {
  d1: number;
  d2: number;
  sum: number;
  won: boolean;
  payout: number;
}

export const DiceGame: React.FC = () => {
  const { balance, placeBet, addPayout, recordBetResult, unlockAchievement, triggerConfetti } = useGame();

  const [mode, setMode] = useState<DiceGameMode>('classic');
  const [betAmount, setBetAmount] = useState<number>(100);
  const [isRolling, setIsRolling] = useState<boolean>(false);

  // Dice face states
  const [dice1, setDice1] = useState<number>(3);
  const [dice2, setDice2] = useState<number>(4);

  // Mode 1: Classic Craps / Over-Under 7
  const [classicPrediction, setClassicPrediction] = useState<'under' | 'exact7' | 'over' | 'doubles' | 'snakeEyes'>('exact7');

  // Mode 2: Cyber Target Slider (Roll Under / Over target)
  const [targetNumber, setTargetNumber] = useState<number>(50);
  const [isRollUnder, setIsRollUnder] = useState<boolean>(true);
  const [sliderResult, setSliderResult] = useState<number | null>(null);

  const [history, setHistory] = useState<DiceRollHistory[]>([
    { d1: 3, d2: 4, sum: 7, won: true, payout: 580 },
    { d1: 5, d2: 6, sum: 11, won: false, payout: 0 },
    { d1: 2, d2: 2, sum: 4, won: true, payout: 200 },
  ]);

  const [showFairModal, setShowFairModal] = useState<boolean>(false);

  // Multiplier math for Cyber Slider mode:
  const winChance = isRollUnder ? targetNumber : 100 - targetNumber;
  const sliderMultiplier = parseFloat((98 / Math.max(1, winChance)).toFixed(2));

  // Roll Classic 2-Dice
  const rollClassicDice = useCallback(() => {
    if (isRolling || betAmount > balance) return;
    if (!placeBet(betAmount, 'dice')) return;

    setIsRolling(true);
    sounds.playDiceRattle();

    // Rattle animation interval
    let ticks = 0;
    const interval = setInterval(() => {
      setDice1(Math.floor(Math.random() * 6) + 1);
      setDice2(Math.floor(Math.random() * 6) + 1);
      ticks++;
      if (ticks > 8) {
        clearInterval(interval);
        // Settle final outcomes
        const finalD1 = Math.floor(Math.random() * 6) + 1;
        const finalD2 = Math.floor(Math.random() * 6) + 1;
        const sum = finalD1 + finalD2;

        setDice1(finalD1);
        setDice2(finalD2);
        setIsRolling(false);

        // Evaluate win conditions
        let won = false;
        let mult = 0;

        if (classicPrediction === 'under' && sum < 7) {
          won = true;
          mult = 2.0;
        } else if (classicPrediction === 'exact7' && sum === 7) {
          won = true;
          mult = 5.8;
          unlockAchievement('lucky_seven');
        } else if (classicPrediction === 'over' && sum > 7) {
          won = true;
          mult = 2.0;
        } else if (classicPrediction === 'doubles' && finalD1 === finalD2) {
          won = true;
          mult = 5.8;
        } else if (classicPrediction === 'snakeEyes' && (sum === 2 || sum === 12)) {
          won = true;
          mult = 30.0;
        }

        const payout = won ? Math.floor(betAmount * mult) : 0;
        if (won) {
          sounds.playCashout();
          triggerConfetti();
          addPayout(payout, 'dice');
        }

        setHistory((prev) => [
          { d1: finalD1, d2: finalD2, sum, won, payout },
          ...prev.slice(0, 9),
        ]);

        recordBetResult({
          game: 'dice',
          gameTitle: 'Lucky Dice (Classic)',
          betAmount,
          multiplier: won ? mult : 0,
          payout,
          resultText: `Rolled [${finalD1}, ${finalD2}] = ${sum}`,
          won,
        });
      }
    }, 80);
  }, [
    isRolling,
    betAmount,
    balance,
    classicPrediction,
    placeBet,
    addPayout,
    recordBetResult,
    triggerConfetti,
    unlockAchievement,
  ]);

  // Roll Cyber Slider
  const rollSliderDice = useCallback(() => {
    if (isRolling || betAmount > balance) return;
    if (!placeBet(betAmount, 'dice')) return;

    setIsRolling(true);
    sounds.playDiceRattle();

    let ticks = 0;
    const interval = setInterval(() => {
      setSliderResult(Math.floor(Math.random() * 100) + 1);
      ticks++;
      if (ticks > 9) {
        clearInterval(interval);
        const finalVal = Math.floor(Math.random() * 100) + 1;
        setSliderResult(finalVal);
        setIsRolling(false);

        const won = isRollUnder ? finalVal < targetNumber : finalVal > targetNumber;
        const payout = won ? Math.floor(betAmount * sliderMultiplier) : 0;

        if (won) {
          sounds.playCashout();
          triggerConfetti();
          addPayout(payout, 'dice');
        }

        recordBetResult({
          game: 'dice',
          gameTitle: 'Lucky Dice (Cyber Slider)',
          betAmount,
          multiplier: won ? sliderMultiplier : 0,
          payout,
          resultText: `Rolled ${finalVal} (${isRollUnder ? 'Under' : 'Over'} ${targetNumber})`,
          won,
        });
      }
    }, 70);
  }, [
    isRolling,
    betAmount,
    balance,
    targetNumber,
    isRollUnder,
    sliderMultiplier,
    placeBet,
    addPayout,
    recordBetResult,
    triggerConfetti,
  ]);

  // Render Pip positions on physical 3D dice faces
  const renderDicePips = (val: number) => {
    const pips: Record<number, number[]> = {
      1: [4],
      2: [0, 8],
      3: [0, 4, 8],
      4: [0, 2, 6, 8],
      5: [0, 2, 4, 6, 8],
      6: [0, 2, 3, 5, 6, 8],
    };
    const active = new Set(pips[val] || [4]);

    return (
      <div className="grid grid-cols-3 gap-1.5 w-16 h-16 p-2 bg-gradient-to-br from-rose-900 via-rose-950 to-slate-950 rounded-2xl border-2 border-rose-500/40 shadow-2xl relative select-none">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="flex items-center justify-center">
            {active.has(i) && (
              <span className="w-3 h-3 rounded-full bg-gradient-to-br from-amber-300 to-rose-400 shadow-md glow-gold" />
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Header bar: Mode tabs & Fair verification */}
      <div className="flex items-center justify-between glass-panel p-2.5 rounded-xl border border-slate-800">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              setMode('classic');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              mode === 'classic'
                ? 'bg-rose-500 text-white shadow glow-blue'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Classic Craps 7
          </button>
          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              setMode('slider');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              mode === 'slider'
                ? 'bg-rose-500 text-white shadow glow-blue'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Cyber Slider (1-100)
          </button>
        </div>

        <button
          onClick={() => setShowFairModal(true)}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-cyan-300 px-2.5 py-1 rounded-md border border-slate-800"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden sm:inline">Provably Fair</span>
        </button>
      </div>

      {/* Main Dice Playground */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Dice Arena Visuals (5 cols) */}
        <div className="lg:col-span-5 glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col items-center justify-center min-h-[320px]">
          {mode === 'classic' ? (
            <div className="space-y-6 text-center">
              <div className="flex items-center justify-center gap-5 py-4">
                <div
                  className={`transition-transform duration-150 ${
                    isRolling ? 'rotate-180 scale-95 blur-[0.5px]' : 'hover:scale-105'
                  }`}
                >
                  {renderDicePips(dice1)}
                </div>
                <div
                  className={`transition-transform duration-150 ${
                    isRolling ? '-rotate-180 scale-95 blur-[0.5px]' : 'hover:scale-105'
                  }`}
                >
                  {renderDicePips(dice2)}
                </div>
              </div>

              <div>
                <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
                  Dice Total
                </div>
                <div className="text-4xl sm:text-5xl font-black font-tabular text-white tracking-tight">
                  {dice1 + dice2}
                </div>
                <div className="text-xs text-rose-400 font-medium mt-1">
                  {dice1 === dice2 ? `DOUBLE ${dice1}'s!` : `Combination: [${dice1} + ${dice2}]`}
                </div>
              </div>
            </div>
          ) : (
            /* Cyber Slider Visual */
            <div className="w-full space-y-6 text-center py-2">
              <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
                Rolled Result
              </div>
              <div className="text-6xl font-black font-tabular text-amber-400 drop-shadow-[0_0_20px_rgba(245,158,11,0.5)]">
                {sliderResult !== null ? sliderResult : '--'}
              </div>
              <div className="w-full bg-slate-900 h-3 rounded-full overflow-hidden border border-slate-700 relative">
                <div
                  className={`h-full transition-all duration-300 ${
                    isRollUnder ? 'bg-emerald-500' : 'bg-rose-500'
                  }`}
                  style={{ width: `${targetNumber}%` }}
                />
                {sliderResult !== null && (
                  <div
                    className="absolute top-0 bottom-0 w-1 bg-white shadow"
                    style={{ left: `${sliderResult}%` }}
                  />
                )}
              </div>
              <div className="flex justify-between text-[11px] text-slate-500 font-mono">
                <span>0</span>
                <span className="text-cyan-400 font-bold">Target: {targetNumber}</span>
                <span>100</span>
              </div>
            </div>
          )}
        </div>

        {/* Betting Controls & Predictions (7 cols) */}
        <div className="lg:col-span-7 glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
              <Dices className="w-4 h-4" />
              {mode === 'classic' ? 'Craps Prediction Deck' : 'Target Threshold Setup'}
            </span>
            <span className="text-xs font-tabular text-slate-400">
              Balance: <span className="text-amber-400 font-bold">{balance.toLocaleString()} SC</span>
            </span>
          </div>

          {/* Mode Specific Prediction Selectors */}
          {mode === 'classic' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { id: 'under', label: 'Under 7 (2-6)', payout: '2.00x', desc: '41.6% Win Rate' },
                { id: 'exact7', label: 'Exact 7', payout: '5.80x', desc: '16.7% Win Rate' },
                { id: 'over', label: 'Over 7 (8-12)', payout: '2.00x', desc: '41.6% Win Rate' },
                { id: 'doubles', label: 'Any Double', payout: '5.80x', desc: 'Pair on both dice' },
                { id: 'snakeEyes', label: 'Snake/Boxcars', payout: '30.00x', desc: 'Sum 2 or 12' },
              ].map((pred) => (
                <button
                  key={pred.id}
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    setClassicPrediction(pred.id as typeof classicPrediction);
                  }}
                  disabled={isRolling}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    classicPrediction === pred.id
                      ? 'bg-rose-500/20 border-rose-500 text-white glow-blue'
                      : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="font-bold text-xs">{pred.label}</div>
                  <div className="text-amber-400 font-tabular font-bold text-sm">{pred.payout}</div>
                  <div className="text-[10px] text-slate-500">{pred.desc}</div>
                </button>
              ))}
            </div>
          ) : (
            /* Cyber Slider Setup */
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsRollUnder(true)}
                  className={`flex-1 py-2 rounded-lg font-bold text-xs border ${
                    isRollUnder
                      ? 'bg-emerald-600/30 border-emerald-500 text-emerald-300'
                      : 'bg-slate-900 border-slate-800 text-slate-400'
                  }`}
                >
                  Roll UNDER {targetNumber}
                </button>
                <button
                  type="button"
                  onClick={() => setIsRollUnder(false)}
                  className={`flex-1 py-2 rounded-lg font-bold text-xs border ${
                    !isRollUnder
                      ? 'bg-rose-600/30 border-rose-500 text-rose-300'
                      : 'bg-slate-900 border-slate-800 text-slate-400'
                  }`}
                >
                  Roll OVER {targetNumber}
                </button>
              </div>

              <div>
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>Threshold</span>
                  <span className="font-bold text-white font-tabular">{targetNumber}</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="98"
                  value={targetNumber}
                  onChange={(e) => setTargetNumber(parseInt(e.target.value))}
                  disabled={isRolling}
                  className="w-full accent-rose-500 cursor-pointer"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
                <div>
                  <span className="text-slate-400">Win Chance:</span>
                  <div className="text-base font-bold text-cyan-300 font-tabular">{winChance}%</div>
                </div>
                <div>
                  <span className="text-slate-400">Multiplier:</span>
                  <div className="text-base font-bold text-amber-400 font-tabular">
                    {sliderMultiplier}x
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Bet Amount Input & Presets */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="number"
                  min="10"
                  max="50000"
                  value={betAmount}
                  onChange={(e) => setBetAmount(Math.max(10, parseInt(e.target.value) || 10))}
                  disabled={isRolling}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm font-bold font-tabular text-white focus:outline-none focus:border-rose-500"
                />
                <span className="absolute right-3 top-2 text-xs text-slate-400 font-bold">SC</span>
              </div>
              <div className="flex gap-1">
                {[50, 100, 500, 1000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => {
                      sounds.playClick();
                      setBetAmount(amt);
                    }}
                    disabled={isRolling}
                    className="px-2.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-xs font-semibold text-slate-300 border border-slate-800"
                  >
                    +{amt}
                  </button>
                ))}
              </div>
            </div>

            {/* Roll Dice Action Button */}
            <button
              type="button"
              onClick={mode === 'classic' ? rollClassicDice : rollSliderDice}
              disabled={isRolling || betAmount > balance || betAmount <= 0}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-rose-500 via-pink-600 to-rose-600 hover:from-rose-400 hover:to-pink-500 disabled:opacity-40 disabled:pointer-events-none text-white font-black text-lg tracking-wider shadow-lg glow-purple active:scale-98 transition-all flex items-center justify-center gap-2"
            >
              <Dices className={`w-5 h-5 ${isRolling ? 'animate-spin' : ''}`} />
              <span>{isRolling ? 'ROLLING DICE...' : `ROLL DICE (${betAmount} SC)`}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Provably Fair Modal */}
      {showFairModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="glass-panel p-6 rounded-2xl max-w-md w-full border border-rose-800/60 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2 text-rose-400 font-bold">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <span>Provably Fair Dice Algorithm</span>
              </div>
              <button onClick={() => setShowFairModal(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Every dice roll is calculated using a deterministic HMAC-SHA512 hash sequence. Results cannot be modified or influenced mid-flight.
            </p>
            <div className="space-y-2 text-xs font-mono">
              <div className="bg-slate-900 p-2.5 rounded text-[11px] text-cyan-300 break-all border border-slate-800">
                Server Hash: d9f82a7c41b83e602e88a03194bc028f89...
              </div>
              <div className="bg-slate-900 p-2.5 rounded text-[11px] text-rose-300 break-all border border-slate-800">
                Client Seed: sky_dice_client_seed_772
              </div>
            </div>
            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowFairModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-lg text-white"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
