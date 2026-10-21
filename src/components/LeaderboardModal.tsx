import React, { useState, useEffect } from 'react';
import { api, ServerStats, LeaderboardEntry } from '../services/api';
import { sounds } from '../services/sound';
import { Trophy, Activity, Users, Flame, ShieldCheck, X, Server } from 'lucide-react';

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({ isOpen, onClose }) => {
  const [stats, setStats] = useState<ServerStats | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [serverOnline, setServerOnline] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!isOpen) return;

    let mounted = true;
    setLoading(true);

    Promise.all([api.checkHealth(), api.getStats(), api.getLeaderboard()])
      .then(([health, serverStats, serverLeaderboard]) => {
        if (!mounted) return;
        setServerOnline(health.status === 'healthy');
        setStats(serverStats);
        setLeaderboard(serverLeaderboard);
        setLoading(false);
      })
      .catch(() => {
        if (!mounted) return;
        setServerOnline(false);
        setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto">
      <div className="glass-panel max-w-xl w-full rounded-2xl border border-slate-800 p-6 space-y-6 shadow-2xl relative animate-in zoom-in-95 duration-200 my-8">
        <button
          onClick={() => {
            sounds.playClick();
            onClose();
          }}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center text-slate-950 font-black shadow-lg">
              <Trophy className="w-6 h-6 text-slate-950" />
            </div>
            <div>
              <h3 className="text-xl font-black text-white font-display">Global Hall of Fame</h3>
              <p className="text-xs text-slate-400">Live platform leaderboard & backend server metrics</p>
            </div>
          </div>

          {/* Server Connection Badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs">
            <span
              className={`w-2 h-2 rounded-full ${
                serverOnline ? 'bg-emerald-400 animate-ping' : 'bg-rose-500'
              }`}
            />
            <span className="font-semibold text-slate-300">
              {serverOnline ? 'Server Active' : 'Offline'}
            </span>
          </div>
        </div>

        {/* Server Telemetry Strip */}
        {stats && (
          <div className="grid grid-cols-3 gap-3 p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs">
            <div>
              <div className="text-slate-400 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-cyan-400" />
                <span>Simulated Online</span>
              </div>
              <div className="text-base font-bold text-white font-tabular mt-0.5">
                {stats.activePlayersOnline.toLocaleString()}
              </div>
            </div>

            <div>
              <div className="text-slate-400 flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-rose-400" />
                <span>Today's Top Flight</span>
              </div>
              <div className="text-base font-bold text-amber-400 font-tabular mt-0.5">
                {stats.biggestFlightMultiplierToday}x
              </div>
            </div>

            <div>
              <div className="text-slate-400 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-purple-400" />
                <span>Rounds Today</span>
              </div>
              <div className="text-base font-bold text-slate-200 font-tabular mt-0.5">
                {stats.totalRoundsToday.toLocaleString()}
              </div>
            </div>
          </div>
        )}

        {/* Leaderboard Table */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
            Top High Rollers (Simulated Winnings)
          </span>

          {loading ? (
            <div className="py-12 text-center text-xs text-slate-400">Loading server rankings...</div>
          ) : (
            <div className="border border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-800/80">
              {leaderboard.map((user) => (
                <div
                  key={user.rank}
                  className="flex items-center justify-between p-3 bg-slate-950/60 hover:bg-slate-900/50 transition-colors text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center font-black text-xs font-tabular ${
                        user.rank === 1
                          ? 'bg-amber-400 text-slate-950'
                          : user.rank === 2
                          ? 'bg-slate-300 text-slate-950'
                          : user.rank === 3
                          ? 'bg-amber-700 text-white'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {user.rank}
                    </span>

                    <span className="text-base">{user.avatar}</span>

                    <div>
                      <div className="font-bold text-white text-sm">{user.name}</div>
                      <div className="text-[10px] text-cyan-400 font-semibold">{user.tier} VIP</div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-amber-400 font-tabular font-bold text-sm">
                      {user.totalWon.toLocaleString()} SC
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Best: <strong className="text-rose-400 font-tabular">{user.bestMultiplier}x</strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Server Info Footer */}
        <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-cyan-400" />
            <span>Full-Stack Express Server (Port 3000)</span>
          </div>
          <span className="text-emerald-400 font-mono">Synced</span>
        </div>
      </div>
    </div>
  );
};
