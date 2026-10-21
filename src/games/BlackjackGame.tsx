import React, { useState, useCallback } from 'react';
import { useGame } from '../context/GameContext';
import { sounds } from '../services/sound';
import { ShieldCheck, RotateCcw, Plus, Check, Award, Layers } from 'lucide-react';

export interface PlayingCard {
  suit: '♠' | '♥' | '♦' | '♣';
  rank: '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A';
  value: number;
}

const SUITS: Array<'♠' | '♥' | '♦' | '♣'> = ['♠', '♥', '♦', '♣'];
const RANKS: Array<PlayingCard['rank']> = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

const createDeck = (): PlayingCard[] => {
  const deck: PlayingCard[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      let value = parseInt(rank);
      if (['J', 'Q', 'K'].includes(rank)) value = 10;
      if (rank === 'A') value = 11;
      deck.push({ suit, rank, value });
    }
  }
  return deck.sort(() => Math.random() - 0.5);
};

// Calculate optimal blackjack score with dynamic Ace handling
export const calculateHandValue = (cards: PlayingCard[]): { total: number; isSoft: boolean } => {
  let total = 0;
  let aces = 0;

  for (const c of cards) {
    total += c.value;
    if (c.rank === 'A') aces++;
  }

  while (total > 21 && aces > 0) {
    total -= 10;
    aces--;
  }

  return { total, isSoft: aces > 0 };
};

export const BlackjackGame: React.FC = () => {
  const { balance, placeBet, addPayout, recordBetResult, unlockAchievement, triggerConfetti } = useGame();

  const [deck, setDeck] = useState<PlayingCard[]>(createDeck);
  const [playerHand, setPlayerHand] = useState<PlayingCard[]>([]);
  const [dealerHand, setDealerHand] = useState<PlayingCard[]>([]);

  const [betAmount, setBetAmount] = useState<number>(100);
  const [gameStage, setGameStage] = useState<'BETTING' | 'PLAYER_TURN' | 'DEALER_TURN' | 'ROUND_OVER'>('BETTING');
  const [roundResult, setRoundResult] = useState<{ message: string; payout: number; type: 'win' | 'lose' | 'push' } | null>(null);

  // Helper to draw card
  const drawCard = (curDeck: PlayingCard[]): { card: PlayingCard; remaining: PlayingCard[] } => {
    let d = [...curDeck];
    if (d.length < 10) {
      d = createDeck();
    }
    const card = d.pop()!;
    sounds.playCardDeal();
    return { card, remaining: d };
  };

  // Deal Initial Hand
  const startRound = useCallback(() => {
    if (balance < betAmount || betAmount <= 0) return;
    if (!placeBet(betAmount, 'blackjack')) return;

    sounds.playChip();
    setRoundResult(null);

    let curDeck = [...deck];
    if (curDeck.length < 10) curDeck = createDeck();

    const p1 = curDeck.pop()!;
    const d1 = curDeck.pop()!;
    const p2 = curDeck.pop()!;
    const d2 = curDeck.pop()!;

    sounds.playCardDeal();

    const initialPlayer = [p1, p2];
    const initialDealer = [d1, d2];

    setPlayerHand(initialPlayer);
    setDealerHand(initialDealer);
    setDeck(curDeck);

    const playerVal = calculateHandValue(initialPlayer).total;
    const dealerVal = calculateHandValue(initialDealer).total;

    // Check Natural Blackjack
    if (playerVal === 21) {
      if (dealerVal === 21) {
        // Push
        setGameStage('ROUND_OVER');
        addPayout(betAmount, 'blackjack');
        setRoundResult({ message: 'Both have Blackjack! Push (Bet Refunded)', payout: betAmount, type: 'push' });
        recordBetResult({
          game: 'blackjack',
          gameTitle: 'VIP Blackjack',
          betAmount,
          multiplier: 1.0,
          payout: betAmount,
          resultText: 'Blackjack Push',
          won: true,
        });
      } else {
        // Natural Blackjack pays 3:2 (2.5x total payout)
        const payout = Math.floor(betAmount * 2.5);
        sounds.playBigWin();
        triggerConfetti();
        unlockAchievement('blackjack_21');
        addPayout(payout, 'blackjack');
        setGameStage('ROUND_OVER');
        setRoundResult({ message: `Natural 21! Blackjack pays 3:2 (+${payout - betAmount} SC)`, payout, type: 'win' });
        recordBetResult({
          game: 'blackjack',
          gameTitle: 'VIP Blackjack',
          betAmount,
          multiplier: 2.5,
          payout,
          resultText: 'Natural Blackjack 3:2',
          won: true,
        });
      }
    } else {
      setGameStage('PLAYER_TURN');
    }
  }, [balance, betAmount, deck, placeBet, addPayout, recordBetResult, unlockAchievement, triggerConfetti]);

  // Player Hits
  const handleHit = useCallback(() => {
    if (gameStage !== 'PLAYER_TURN') return;

    const { card, remaining } = drawCard(deck);
    const newHand = [...playerHand, card];
    setPlayerHand(newHand);
    setDeck(remaining);

    const newScore = calculateHandValue(newHand).total;
    if (newScore > 21) {
      // Player Busts
      setGameStage('ROUND_OVER');
      sounds.playClick();
      setRoundResult({ message: `Bust at ${newScore}! House wins hand.`, payout: 0, type: 'lose' });
      recordBetResult({
        game: 'blackjack',
        gameTitle: 'VIP Blackjack',
        betAmount,
        multiplier: 0,
        payout: 0,
        resultText: `Player bust (${newScore})`,
        won: false,
      });
    } else if (newScore === 21) {
      // Auto stand at 21
      handleStand(newHand, remaining, betAmount);
    }
  }, [gameStage, deck, playerHand, betAmount, recordBetResult]);

  // Player Stands -> Dealer Turn
  const handleStand = useCallback(
    (customPlayerHand?: PlayingCard[], customDeck?: PlayingCard[], currentBet: number = betAmount) => {
      if (gameStage !== 'PLAYER_TURN' && !customPlayerHand) return;

      setGameStage('DEALER_TURN');
      sounds.playClick();

      const curPlayer = customPlayerHand || playerHand;
      const playerVal = calculateHandValue(curPlayer).total;

      let curDealer = [...dealerHand];
      let curDeck = customDeck || [...deck];

      // Dealer must hit on 16 or soft 17, stand on 17+
      const dealerPlayInterval = setInterval(() => {
        const dealerScore = calculateHandValue(curDealer).total;

        if (dealerScore < 17) {
          if (curDeck.length < 5) curDeck = createDeck();
          const nextCard = curDeck.pop()!;
          sounds.playCardDeal();
          curDealer = [...curDealer, nextCard];
          setDealerHand([...curDealer]);
          setDeck([...curDeck]);
        } else {
          // Dealer stands or busts
          clearInterval(dealerPlayInterval);
          setGameStage('ROUND_OVER');

          const finalDealerVal = dealerScore;

          if (finalDealerVal > 21) {
            // Dealer busts
            const payout = currentBet * 2;
            sounds.playCashout();
            triggerConfetti();
            addPayout(payout, 'blackjack');
            setRoundResult({
              message: `Dealer busts at ${finalDealerVal}! You win ${payout.toLocaleString()} SC!`,
              payout,
              type: 'win',
            });
            recordBetResult({
              game: 'blackjack',
              gameTitle: 'VIP Blackjack',
              betAmount: currentBet,
              multiplier: 2.0,
              payout,
              resultText: `Dealer bust (${finalDealerVal})`,
              won: true,
            });
          } else if (playerVal > finalDealerVal) {
            // Player higher
            const payout = currentBet * 2;
            sounds.playCashout();
            triggerConfetti();
            addPayout(payout, 'blackjack');
            setRoundResult({
              message: `You beat Dealer (${playerVal} vs ${finalDealerVal})! Won ${payout.toLocaleString()} SC!`,
              payout,
              type: 'win',
            });
            recordBetResult({
              game: 'blackjack',
              gameTitle: 'VIP Blackjack',
              betAmount: currentBet,
              multiplier: 2.0,
              payout,
              resultText: `Win ${playerVal} vs ${finalDealerVal}`,
              won: true,
            });
          } else if (playerVal === finalDealerVal) {
            // Push
            addPayout(currentBet, 'blackjack');
            setRoundResult({
              message: `Push at ${playerVal}! Bet refunded.`,
              payout: currentBet,
              type: 'push',
            });
            recordBetResult({
              game: 'blackjack',
              gameTitle: 'VIP Blackjack',
              betAmount: currentBet,
              multiplier: 1.0,
              payout: currentBet,
              resultText: `Push (${playerVal})`,
              won: true,
            });
          } else {
            // Dealer higher
            setRoundResult({
              message: `Dealer wins (${finalDealerVal} vs ${playerVal}).`,
              payout: 0,
              type: 'lose',
            });
            recordBetResult({
              game: 'blackjack',
              gameTitle: 'VIP Blackjack',
              betAmount: currentBet,
              multiplier: 0,
              payout: 0,
              resultText: `Loss ${playerVal} vs ${finalDealerVal}`,
              won: false,
            });
          }
        }
      }, 600);
    },
    [gameStage, playerHand, dealerHand, deck, betAmount, addPayout, recordBetResult, triggerConfetti]
  );

  // Player Double Down
  const handleDoubleDown = useCallback(() => {
    if (gameStage !== 'PLAYER_TURN' || playerHand.length !== 2) return;
    if (balance < betAmount) return;

    // Place second bet equal to initial
    if (!placeBet(betAmount, 'blackjack')) return;

    sounds.playChip();
    const doubleBetTotal = betAmount * 2;
    setBetAmount(doubleBetTotal);

    // Draw exactly one card
    const { card, remaining } = drawCard(deck);
    const newHand = [...playerHand, card];
    setPlayerHand(newHand);
    setDeck(remaining);

    const newScore = calculateHandValue(newHand).total;
    if (newScore > 21) {
      setGameStage('ROUND_OVER');
      setRoundResult({ message: `Double Down bust at ${newScore}!`, payout: 0, type: 'lose' });
      recordBetResult({
        game: 'blackjack',
        gameTitle: 'VIP Blackjack',
        betAmount: doubleBetTotal,
        multiplier: 0,
        payout: 0,
        resultText: `Double down bust (${newScore})`,
        won: false,
      });
    } else {
      // Immediately stand
      handleStand(newHand, remaining, doubleBetTotal);
    }
  }, [gameStage, playerHand, balance, betAmount, placeBet, deck, recordBetResult, handleStand]);

  // Restart Hand
  const restartGame = () => {
    sounds.playClick();
    setPlayerHand([]);
    setDealerHand([]);
    setGameStage('BETTING');
    setRoundResult(null);
  };

  const playerScore = calculateHandValue(playerHand);
  const dealerScore = calculateHandValue(
    gameStage === 'BETTING' || gameStage === 'PLAYER_TURN' ? dealerHand.slice(0, 1) : dealerHand
  );

  return (
    <div className="space-y-4">
      {/* Table Rules Banner */}
      <div className="flex items-center justify-between glass-panel p-2.5 rounded-xl border border-slate-800 text-xs">
        <div className="flex items-center gap-2 text-slate-400">
          <Layers className="w-3.5 h-3.5 text-cyan-400" />
          <span>VIP Table Rules:</span>
          <span className="text-slate-300 font-semibold hidden sm:inline">
            Blackjack pays 3 to 2 · Dealer stands on 17 · Double Down permitted
          </span>
        </div>
        <div className="font-tabular text-amber-400 font-bold">
          Deck: {deck.length} cards remaining
        </div>
      </div>

      {/* Main Luxury Navy Felt Table */}
      <div className="relative glass-panel rounded-2xl border border-slate-800 p-6 sm:p-8 bg-gradient-to-b from-slate-950 via-[#0a1428] to-[#040814] shadow-2xl min-h-[460px] flex flex-col justify-between overflow-hidden">
        {/* Table Felt Arch Watermark */}
        <div className="absolute inset-x-8 top-12 bottom-12 border-2 border-amber-500/10 rounded-full pointer-events-none select-none flex items-center justify-center">
          <span className="text-amber-500/10 text-3xl font-black font-display tracking-widest uppercase">
            SkyPlay VIP High Roller Club
          </span>
        </div>

        {/* Dealer Area (Top) */}
        <div className="relative z-10 space-y-2 text-center">
          <div className="flex items-center justify-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            <span>Dealer's Hand</span>
            {dealerHand.length > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-slate-900 border border-slate-700 text-slate-200 font-tabular font-bold">
                {gameStage === 'PLAYER_TURN' ? `${dealerHand[0].value} + ?` : dealerScore.total}
              </span>
            )}
          </div>

          <div className="flex items-center justify-center gap-3 min-h-[110px]">
            {dealerHand.map((card, idx) => {
              const isHidden = idx === 1 && gameStage === 'PLAYER_TURN';
              const isRed = card.suit === '♥' || card.suit === '♦';

              return (
                <div
                  key={idx}
                  className={`w-20 h-28 sm:w-24 sm:h-32 rounded-xl p-2.5 flex flex-col justify-between border-2 shadow-2xl select-none transition-all transform duration-300 ${
                    isHidden
                      ? 'bg-gradient-to-br from-indigo-900 to-slate-900 border-cyan-500/40'
                      : 'bg-white border-amber-400/60'
                  }`}
                >
                  {isHidden ? (
                    <div className="h-full flex items-center justify-center border border-cyan-500/20 rounded-lg">
                      <span className="text-cyan-400 font-bold text-xs uppercase">Sky</span>
                    </div>
                  ) : (
                    <>
                      <div className={`text-left font-bold ${isRed ? 'text-rose-600' : 'text-slate-900'}`}>
                        <div className="text-base sm:text-lg leading-none">{card.rank}</div>
                        <div className="text-xs leading-none">{card.suit}</div>
                      </div>
                      <div
                        className={`text-center text-2xl sm:text-3xl ${
                          isRed ? 'text-rose-600' : 'text-slate-900'
                        }`}
                      >
                        {card.suit}
                      </div>
                      <div
                        className={`text-right font-bold rotate-180 ${
                          isRed ? 'text-rose-600' : 'text-slate-900'
                        }`}
                      >
                        <div className="text-base sm:text-lg leading-none">{card.rank}</div>
                        <div className="text-xs leading-none">{card.suit}</div>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
            {dealerHand.length === 0 && (
              <div className="w-20 h-28 rounded-xl border-2 border-dashed border-slate-700/60 flex items-center justify-center text-xs text-slate-500">
                Dealer
              </div>
            )}
          </div>
        </div>

        {/* Center Round Result Toast */}
        {roundResult && (
          <div className="relative z-20 my-2 text-center animate-in zoom-in-95 duration-200">
            <div
              className={`inline-block px-5 py-2 rounded-xl border font-bold text-sm shadow-xl ${
                roundResult.type === 'win'
                  ? 'bg-emerald-950/80 border-emerald-500/80 text-emerald-300 glow-gold'
                  : roundResult.type === 'push'
                  ? 'bg-amber-950/80 border-amber-500/80 text-amber-300'
                  : 'bg-rose-950/80 border-rose-500/80 text-rose-300'
              }`}
            >
              {roundResult.message}
            </div>
          </div>
        )}

        {/* Player Area (Bottom) */}
        <div className="relative z-10 space-y-2 text-center">
          <div className="flex items-center justify-center gap-3 min-h-[110px]">
            {playerHand.map((card, idx) => {
              const isRed = card.suit === '♥' || card.suit === '♦';

              return (
                <div
                  key={idx}
                  className="w-20 h-28 sm:w-24 sm:h-32 rounded-xl p-2.5 flex flex-col justify-between border-2 border-amber-400/60 bg-white shadow-2xl select-none transition-all transform duration-200 hover:-translate-y-1"
                >
                  <div className={`text-left font-bold ${isRed ? 'text-rose-600' : 'text-slate-900'}`}>
                    <div className="text-base sm:text-lg leading-none">{card.rank}</div>
                    <div className="text-xs leading-none">{card.suit}</div>
                  </div>
                  <div className={`text-center text-2xl sm:text-3xl ${isRed ? 'text-rose-600' : 'text-slate-900'}`}>
                    {card.suit}
                  </div>
                  <div className={`text-right font-bold rotate-180 ${isRed ? 'text-rose-600' : 'text-slate-900'}`}>
                    <div className="text-base sm:text-lg leading-none">{card.rank}</div>
                    <div className="text-xs leading-none">{card.suit}</div>
                  </div>
                </div>
              );
            })}
            {playerHand.length === 0 && (
              <div className="w-20 h-28 rounded-xl border-2 border-dashed border-slate-700/60 flex items-center justify-center text-xs text-slate-500">
                Your Hand
              </div>
            )}
          </div>

          <div className="flex items-center justify-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            <span>Your Hand Total</span>
            {playerHand.length > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-500 text-cyan-300 font-tabular font-bold">
                {playerScore.total} {playerScore.isSoft ? '(Soft)' : ''}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Interactive Control Deck */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 space-y-3">
        {gameStage === 'BETTING' ? (
          /* Betting Mode Controls */
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1.5 w-full sm:w-auto">
              <span className="text-xs text-slate-400 font-semibold">Select Bet Stake:</span>
              <div className="flex items-center gap-1.5 overflow-x-auto py-1">
                {[50, 100, 250, 500, 1000, 2500].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => {
                      sounds.playChip();
                      setBetAmount(amt);
                    }}
                    className={`px-3 py-2 rounded-xl font-bold text-xs font-tabular border transition-all ${
                      betAmount === amt
                        ? 'border-amber-400 bg-amber-500/20 text-amber-300 shadow glow-gold scale-105'
                        : 'border-slate-800 bg-slate-900 text-slate-300 hover:border-slate-600'
                    }`}
                  >
                    {amt.toLocaleString()} SC
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={startRound}
              disabled={balance < betAmount || betAmount <= 0}
              className="w-full sm:w-60 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-lg shadow-lg active:scale-98 transition-all flex items-center justify-center gap-2"
            >
              <Award className="w-5 h-5 text-slate-900" />
              <span>DEAL HAND</span>
            </button>
          </div>
        ) : gameStage === 'PLAYER_TURN' ? (
          /* Live Turn Controls: Hit, Stand, Double Down */
          <div className="grid grid-cols-3 gap-3">
            <button
              type="button"
              onClick={handleHit}
              className="py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-base shadow glow-blue active:scale-98 transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              <span>HIT</span>
            </button>
            <button
              type="button"
              onClick={() => handleStand()}
              className="py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-black text-base shadow glow-gold active:scale-98 transition-all flex items-center justify-center gap-2"
            >
              <Check className="w-5 h-5" />
              <span>STAND</span>
            </button>
            <button
              type="button"
              onClick={handleDoubleDown}
              disabled={playerHand.length !== 2 || balance < betAmount}
              className="py-3 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 disabled:opacity-40 disabled:pointer-events-none text-white font-bold text-base shadow active:scale-98 transition-all flex items-center justify-center gap-2"
            >
              <span>2X DOUBLE</span>
            </button>
          </div>
        ) : (
          /* Round Over Controls: Deal Again */
          <div className="flex items-center justify-between gap-4">
            <div className="text-xs text-slate-400">
              Round Complete. Ready for next hand?
            </div>
            <button
              type="button"
              onClick={restartGame}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black text-base shadow glow-blue active:scale-98 transition-all flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>NEW HAND</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
