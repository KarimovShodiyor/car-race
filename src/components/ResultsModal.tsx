import React from 'react';
import { Trophy, Zap, Gauge, Flame, RotateCcw, Home, Wrench } from 'lucide-react';

interface ResultsModalProps {
  isOpen: boolean;
  position: number;
  totalTime: number;
  bestLapTime: number | null;
  coinsEarned: number;
  distance: number;
  maxSpeed: number;
  driftScore: number;
  onRestart: () => void;
  onOpenGarage: () => void;
  onMenu: () => void;
}

export const ResultsModal: React.FC<ResultsModalProps> = ({
  isOpen,
  position,
  totalTime,
  bestLapTime,
  coinsEarned,
  distance,
  maxSpeed,
  driftScore,
  onRestart,
  onOpenGarage,
  onMenu,
}) => {
  if (!isOpen) return null;

  const isPodium = position <= 3;

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    const ms = Math.floor((secs % 1) * 100);
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md select-none font-tech">
      <div className="w-full max-w-lg bg-slate-900 border border-cyan-500/40 rounded-2xl p-6 shadow-2xl shadow-cyan-950/90 flex flex-col">
        {/* Header Title */}
        <div className="text-center pb-4 border-b border-slate-800">
          <div className="inline-flex p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 mb-2">
            <Trophy className="w-10 h-10" />
          </div>
          <h2 className="text-3xl font-black font-cyber text-white tracking-wider">
            {isPodium ? 'RACE COMPLETED!' : 'RACE FINISHED'}
          </h2>
          <p className="text-sm font-cyber text-cyan-400 mt-1">
            {position === 1 ? '🥇 1ST PLACE CHAMPION' : position === 2 ? '🥈 2ND PLACE PODIUM' : position === 3 ? '🥉 3RD PLACE PODIUM' : `FINISHED POSITION: ${position}TH`}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 my-5">
          {/* Total Time */}
          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 flex flex-col">
            <span className="text-[10px] font-cyber text-slate-400">TOTAL RACE TIME</span>
            <span className="text-lg font-cyber font-bold text-white mt-1">
              {formatTime(totalTime)}
            </span>
          </div>

          {/* Best Lap */}
          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 flex flex-col">
            <span className="text-[10px] font-cyber text-slate-400">BEST LAP RECORD</span>
            <span className="text-lg font-cyber font-bold text-cyan-300 mt-1">
              {bestLapTime ? formatTime(bestLapTime) : '--:--.--'}
            </span>
          </div>

          {/* Max Speed */}
          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 flex flex-col">
            <span className="text-[10px] font-cyber text-slate-400 flex items-center">
              <Gauge className="w-3 h-3 mr-1 text-cyan-400" /> MAX SPEED
            </span>
            <span className="text-lg font-cyber font-bold text-white mt-1">
              {maxSpeed} <span className="text-xs text-slate-400">KM/H</span>
            </span>
          </div>

          {/* Drift Points */}
          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 flex flex-col">
            <span className="text-[10px] font-cyber text-slate-400 flex items-center">
              <Flame className="w-3 h-3 mr-1 text-fuchsia-400" /> DRIFT SCORE
            </span>
            <span className="text-lg font-cyber font-bold text-fuchsia-300 mt-1">
              {driftScore.toLocaleString()} PTS
            </span>
          </div>
        </div>

        {/* Prize Reward Banner */}
        <div className="bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-transparent border border-amber-500/40 rounded-xl p-3 flex items-center justify-between mb-5">
          <div className="flex items-center space-x-2 text-amber-400 font-cyber font-bold text-sm">
            <Zap className="w-5 h-5 fill-current" />
            <span>CREDITS EARNED</span>
          </div>
          <span className="font-cyber font-black text-xl text-amber-300">+{coinsEarned} CR</span>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={onRestart}
            className="py-3 px-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-cyber font-bold text-xs rounded-xl flex flex-col items-center justify-center space-y-1 transition-all shadow-lg shadow-cyan-500/20 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>RESTART</span>
          </button>

          <button
            onClick={onOpenGarage}
            className="py-3 px-2 bg-slate-800 hover:bg-slate-700 text-white font-cyber font-bold text-xs rounded-xl border border-slate-700 flex flex-col items-center justify-center space-y-1 transition-all cursor-pointer"
          >
            <Wrench className="w-4 h-4 text-cyan-400" />
            <span>GARAGE</span>
          </button>

          <button
            onClick={onMenu}
            className="py-3 px-2 bg-slate-800 hover:bg-slate-700 text-white font-cyber font-bold text-xs rounded-xl border border-slate-700 flex flex-col items-center justify-center space-y-1 transition-all cursor-pointer"
          >
            <Home className="w-4 h-4 text-amber-400" />
            <span>MENU</span>
          </button>
        </div>
      </div>
    </div>
  );
};
