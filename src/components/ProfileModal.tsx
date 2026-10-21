import React, { useState } from 'react';
import { useGame, VIP_TIERS } from '../context/GameContext';
import { sounds } from '../services/sound';
import { User, Volume2, VolumeX, Zap, RefreshCw, Trophy, Crown, X, Check } from 'lucide-react';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AVATARS = [
  'astronaut', 'cyberpilot', 'highroller', 'starcommander',
  'quantumqueen', 'solarace', 'shadowrider', 'aurora'
];

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
  const { profile, updateProfile, currentTier, nextTier, tierProgress, resetAllStats } = useGame();
  const [nameInput, setNameInput] = useState(profile.name);
  const [isEditingName, setIsEditingName] = useState(false);
  const [showConfirmReset, setShowConfirmReset] = useState(false);

  if (!isOpen) return null;

  const saveName = () => {
    if (nameInput.trim()) {
      updateProfile({ name: nameInput.trim() });
    }
    setIsEditingName(false);
    sounds.playClick();
  };

  const handleReset = () => {
    resetAllStats();
    setShowConfirmReset(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto">
      <div className="glass-panel max-w-lg w-full rounded-2xl border border-slate-800 p-6 space-y-6 shadow-2xl relative animate-in zoom-in-95 duration-200 my-8">
        <button
          onClick={() => {
            sounds.playClick();
            onClose();
          }}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* User Card Header */}
        <div className="flex items-center gap-4 border-b border-slate-800 pb-5">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-2xl font-black shadow-xl"
            style={{ backgroundColor: currentTier.color }}
          >
            {profile.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            {isEditingName ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  maxLength={18}
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  className="bg-slate-900 border border-cyan-500 rounded-lg px-2.5 py-1 text-sm font-bold text-white focus:outline-none"
                />
                <button
                  onClick={saveName}
                  className="p-1 rounded bg-cyan-600 text-white hover:bg-cyan-500"
                >
                  <Check className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-black text-white truncate">{profile.name}</h3>
                <button
                  onClick={() => setIsEditingName(true)}
                  className="text-xs text-cyan-400 hover:underline"
                >
                  Edit
                </button>
              </div>
            )}
            <div className="flex items-center gap-2 mt-1">
              <span
                className="px-2 py-0.5 rounded text-[11px] font-extrabold uppercase tracking-wide text-slate-950"
                style={{ backgroundColor: currentTier.color }}
              >
                {currentTier.tier} VIP
              </span>
              <span className="text-xs text-slate-400">
                {currentTier.bonusMultiplier}x Daily Bonus
              </span>
            </div>
          </div>
        </div>

        {/* VIP Tier Progression */}
        <div className="space-y-2 p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 font-semibold">VIP Status Progress</span>
            <span className="text-slate-300 font-bold font-tabular">
              {profile.totalWagered.toLocaleString()} / {nextTier ? nextTier.minWagered.toLocaleString() : 'MAX'} SC
            </span>
          </div>
          <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 via-purple-500 to-amber-400 transition-all duration-300"
              style={{ width: `${tierProgress}%` }}
            />
          </div>
          <div className="flex justify-between text-[11px] text-slate-500">
            <span>{currentTier.tier}</span>
            <span>{nextTier ? `Next: ${nextTier.tier}` : 'Max VIP Level Achieved!'}</span>
          </div>
        </div>

        {/* Lifetime Gameplay Telemetry */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Simulated Statistics
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
              <div className="text-[11px] text-slate-400">Rounds Played</div>
              <div className="text-base font-bold text-white font-tabular">{profile.gamesPlayed}</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
              <div className="text-[11px] text-slate-400">Total Wagered</div>
              <div className="text-base font-bold text-amber-400 font-tabular">
                {profile.totalWagered.toLocaleString()} SC
              </div>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 col-span-2 sm:col-span-1">
              <div className="text-[11px] text-slate-400">Total Won</div>
              <div className="text-base font-bold text-emerald-400 font-tabular">
                {profile.totalWon.toLocaleString()} SC
              </div>
            </div>
          </div>
        </div>

        {/* Preferences Toggles */}
        <div className="space-y-3 pt-2 border-t border-slate-800">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Game Settings
          </span>
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="flex items-center gap-2.5">
              {profile.soundEnabled ? <Volume2 className="w-5 h-5 text-cyan-400" /> : <VolumeX className="w-5 h-5 text-slate-500" />}
              <div>
                <div className="text-xs font-bold text-slate-200">Audio Synthesizer</div>
                <div className="text-[11px] text-slate-400">Sound effects for flight, dice, & wheel</div>
              </div>
            </div>
            <button
              onClick={() => {
                const nextVal = !profile.soundEnabled;
                updateProfile({ soundEnabled: nextVal });
                if (nextVal) sounds.playClick();
              }}
              className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                profile.soundEnabled ? 'bg-cyan-500' : 'bg-slate-700'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  profile.soundEnabled ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Reset / Danger Zone */}
        <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
          {showConfirmReset ? (
            <div className="flex items-center gap-2 w-full justify-between">
              <span className="text-xs text-rose-400 font-bold">Reset all local coins & history?</span>
              <div className="flex gap-2">
                <button
                  onClick={handleReset}
                  className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs"
                >
                  Yes, Reset
                </button>
                <button
                  onClick={() => setShowConfirmReset(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowConfirmReset(true)}
              className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset Statistics & Wallet</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
