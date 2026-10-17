import React from 'react';
import { Play, Wrench, Layers, Settings, Zap, Trophy, ShieldAlert } from 'lucide-react';
import { GameMode, Difficulty, CarSpecs } from '../types/game';

interface IntroScreenProps {
  onStartRace: () => void;
  onOpenGarage: () => void;
  onOpenModes: () => void;
  onOpenSettings: () => void;
  selectedCar: CarSpecs;
  currentMode: GameMode;
  currentDifficulty: Difficulty;
  totalCoins: number;
}

export const IntroScreen: React.FC<IntroScreenProps> = ({
  onStartRace,
  onOpenGarage,
  onOpenModes,
  onOpenSettings,
  selectedCar,
  currentMode,
  currentDifficulty,
  totalCoins,
}) => {
  const modeNames: Record<GameMode, string> = {
    career: 'CAREER GP (3 LAPS)',
    endless: 'ENDLESS HIGHWAY',
    timetrial: 'TIME TRIAL ATTACK',
    drift: 'DRIFT CHALLENGE',
    freedrive: 'FREE DRIVE EXPLORATION',
  };

  return (
    <div className="absolute inset-0 z-40 flex flex-col justify-between p-6 sm:p-12 select-none font-tech overflow-hidden">
      {/* Background Cyberpunk Ambient Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-transparent pointer-events-none" />

      {/* Top Header Row */}
      <div className="relative z-10 flex justify-between items-center w-full">
        {/* Studio Badge */}
        <div className="flex items-center space-x-2">
          <div className="w-2.5 h-2.5 bg-cyan-400 rounded-sm" />
          <span className="text-xs font-cyber tracking-widest text-cyan-400 font-bold uppercase">
            NEON VELOCITY ENGINE 2099
          </span>
        </div>

        {/* Currency & Quick Settings */}
        <div className="flex items-center space-x-3">
          <div className="bg-slate-900/80 border border-amber-500/40 rounded-xl px-3.5 py-1.5 backdrop-blur-md flex items-center space-x-2 text-amber-400 shadow-lg">
            <Zap className="w-4 h-4 fill-amber-400" />
            <span className="font-cyber font-bold text-sm">{totalCoins} CREDITS</span>
          </div>

          <button
            onClick={onOpenSettings}
            className="p-2.5 bg-slate-900/80 hover:bg-slate-800 border border-slate-700 hover:border-cyan-400 rounded-xl text-slate-300 hover:text-white transition-colors backdrop-blur-md cursor-pointer"
            title="Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Center Cinematic Title */}
      <div className="relative z-10 my-auto flex flex-col items-center text-center max-w-2xl mx-auto">
        <div className="inline-block px-4 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/50 text-cyan-300 text-xs font-cyber font-bold tracking-widest mb-3 backdrop-blur-sm">
          NEXT-GEN 3D SCI-FI RACING
        </div>

        <h1 className="text-5xl sm:text-7xl font-black font-cyber tracking-tighter text-white drop-shadow-2xl">
          CYBER<span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-fuchsia-500">PULSE</span>
        </h1>
        <div className="text-lg sm:text-2xl font-cyber tracking-widest text-cyan-400 font-bold mt-1">
          2099 : NEON VELOCITY
        </div>

        <p className="text-xs sm:text-sm text-slate-400 max-w-lg mt-3 leading-relaxed">
          Tear through glowing cyber megacities at 300+ km/h with nitro boosts, responsive drift physics, and high-speed rival supercars.
        </p>

        {/* Selected Loadout Summary Badge */}
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            onClick={onOpenGarage}
            className="px-3.5 py-1.5 rounded-lg bg-slate-900/70 border border-slate-700 hover:border-cyan-400 flex items-center space-x-2 text-xs font-cyber text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <span className="text-cyan-400 font-bold">CAR:</span>
            <span>{selectedCar.name}</span>
          </button>

          <button
            onClick={onOpenModes}
            className="px-3.5 py-1.5 rounded-lg bg-slate-900/70 border border-slate-700 hover:border-cyan-400 flex items-center space-x-2 text-xs font-cyber text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <span className="text-fuchsia-400 font-bold">MODE:</span>
            <span>{modeNames[currentMode]}</span>
          </button>

          <button
            onClick={onOpenModes}
            className="px-3.5 py-1.5 rounded-lg bg-slate-900/70 border border-slate-700 hover:border-cyan-400 flex items-center space-x-2 text-xs font-cyber text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <span className="text-amber-400 font-bold">DIFF:</span>
            <span className="uppercase">{currentDifficulty}</span>
          </button>
        </div>
      </div>

      {/* Bottom Main Navigation Buttons */}
      <div className="relative z-10 flex flex-col sm:flex-row items-center justify-center gap-4 max-w-xl mx-auto w-full">
        {/* START RACE PRIMARY BUTTON */}
        <button
          onClick={onStartRace}
          className="w-full sm:flex-1 py-4 px-8 bg-gradient-to-r from-cyan-500 via-sky-400 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-cyber font-black text-lg tracking-wider rounded-2xl shadow-xl shadow-cyan-500/30 hover:shadow-cyan-400/50 flex items-center justify-center space-x-2 active:scale-95 transition-all cursor-pointer"
        >
          <Play className="w-6 h-6 fill-current" />
          <span>START RACE</span>
        </button>

        {/* GARAGE BUTTON */}
        <button
          onClick={onOpenGarage}
          className="w-full sm:w-auto py-4 px-6 bg-slate-900/90 hover:bg-slate-800 border border-cyan-500/40 hover:border-cyan-400 text-cyan-300 hover:text-white font-cyber font-bold text-sm tracking-wider rounded-2xl backdrop-blur-md shadow-lg flex items-center justify-center space-x-2 active:scale-95 transition-all cursor-pointer"
        >
          <Wrench className="w-5 h-5 text-cyan-400" />
          <span>CYBER GARAGE</span>
        </button>

        {/* MODES BUTTON */}
        <button
          onClick={onOpenModes}
          className="w-full sm:w-auto py-4 px-6 bg-slate-900/90 hover:bg-slate-800 border border-fuchsia-500/40 hover:border-fuchsia-400 text-fuchsia-300 hover:text-white font-cyber font-bold text-sm tracking-wider rounded-2xl backdrop-blur-md shadow-lg flex items-center justify-center space-x-2 active:scale-95 transition-all cursor-pointer"
        >
          <Layers className="w-5 h-5 text-fuchsia-400" />
          <span>GAME MODES</span>
        </button>
      </div>
    </div>
  );
};
