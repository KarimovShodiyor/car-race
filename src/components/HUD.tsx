import React, { useState, useEffect } from 'react';
import {
  Gauge,
  Zap,
  Trophy,
  Timer,
  Camera,
  Pause,
  ChevronDown,
  ChevronUp,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { PlayerState, GameMode, CameraView } from '../types/game';

interface HUDProps {
  playerState: PlayerState;
  mode: GameMode;
  cameraView: CameraView;
  onCameraToggle: () => void;
  onPause: () => void;
  onNitroClick?: () => void;
  isMuted: boolean;
  onMuteToggle: () => void;
}

export const HUD: React.FC<HUDProps> = ({
  playerState,
  mode,
  cameraView,
  onCameraToggle,
  onPause,
  onNitroClick,
  isMuted,
  onMuteToggle,
}) => {
  const [collapsed, setCollapsed] = useState(false);

  // Keyboard shortcut 'H' to toggle UI collapse
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'h') {
        setCollapsed((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    const ms = Math.floor((secs % 1) * 100);
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  const rpmPercent = Math.min(100, Math.max(0, (playerState.rpm / 9000) * 100));
  const nitroPercent = Math.min(100, Math.max(0, playerState.nitro));

  const cameraLabels: Record<CameraView, string> = {
    'chase-close': 'CHASE',
    'chase-far': 'HIGH',
    hood: 'HOOD',
    'top-down': 'ORBIT',
  };

  return (
    <div className="absolute inset-0 pointer-events-none select-none overflow-hidden font-tech flex flex-col justify-between p-4 sm:p-6">
      {/* TOP BAR */}
      <div className="flex justify-between items-start w-full">
        {/* Left: Race Stats Glass Badge */}
        <div className="pointer-events-auto bg-slate-900/80 border border-cyan-500/30 rounded-lg p-3 backdrop-blur-md shadow-lg shadow-cyan-950/40 text-slate-100 flex items-center space-x-4">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-wider text-cyan-400 font-bold font-cyber">
              {mode === 'endless' ? 'ENDLESS HIGHWAY' : mode === 'drift' ? 'DRIFT CHALLENGE' : 'CIRCUIT GP'}
            </span>
            <div className="flex items-center space-x-3 text-lg font-bold font-cyber">
              {mode !== 'endless' ? (
                <>
                  <div className="flex items-center text-amber-400">
                    <Trophy className="w-4 h-4 mr-1 inline" />
                    <span>
                      P{playerState.position}
                      <span className="text-xs text-slate-400 font-normal">/{playerState.totalRacers}</span>
                    </span>
                  </div>
                  <div className="text-slate-400">|</div>
                  <div className="text-cyan-300">
                    LAP {playerState.lap}/{playerState.totalLaps}
                  </div>
                </>
              ) : (
                <div className="text-cyan-300">
                  {playerState.distance.toLocaleString()} <span className="text-xs text-slate-400">METERS</span>
                </div>
              )}
            </div>
          </div>

          <div className="h-8 w-[1px] bg-cyan-500/20" />

          {/* Timer */}
          <div className="flex flex-col items-start">
            <div className="flex items-center text-xs text-slate-400">
              <Timer className="w-3.5 h-3.5 mr-1 text-slate-400" />
              <span>{mode === 'endless' ? 'SURVIVAL' : 'CURRENT LAP'}</span>
            </div>
            <span className="text-base font-cyber text-slate-100">
              {formatTime(playerState.currentLapTime)}
            </span>
          </div>
        </div>

        {/* Right: Currency & Quick Actions */}
        <div className="pointer-events-auto flex items-center space-x-2">
          {/* Energy Coins */}
          <div className="bg-slate-900/80 border border-amber-500/40 rounded-lg px-3 py-2 backdrop-blur-md flex items-center space-x-2 text-amber-400 shadow-lg">
            <Zap className="w-4 h-4 fill-amber-400" />
            <span className="font-cyber font-bold text-sm">{playerState.coins} CR</span>
          </div>

          {/* Camera View Switcher */}
          <button
            onClick={onCameraToggle}
            title="Switch Camera (C)"
            className="bg-slate-900/80 hover:bg-slate-800 border border-cyan-500/30 hover:border-cyan-400 rounded-lg px-3 py-2 backdrop-blur-md flex items-center space-x-1.5 text-cyan-300 transition-colors shadow-lg cursor-pointer"
          >
            <Camera className="w-4 h-4" />
            <span className="text-xs font-cyber font-bold">{cameraLabels[cameraView]}</span>
          </button>

          {/* Audio Mute Switcher */}
          <button
            onClick={onMuteToggle}
            title="Audio Mute"
            className="bg-slate-900/80 hover:bg-slate-800 border border-cyan-500/30 hover:border-cyan-400 rounded-lg p-2.5 backdrop-blur-md text-cyan-300 transition-colors shadow-lg cursor-pointer"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* Pause Button */}
          <button
            onClick={onPause}
            title="Pause Game (ESC)"
            className="bg-slate-900/80 hover:bg-slate-800 border border-slate-700 hover:border-cyan-400 rounded-lg p-2.5 backdrop-blur-md text-slate-300 hover:text-white transition-colors shadow-lg cursor-pointer"
          >
            <Pause className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* DRIFT NOTIFIER (Center Display) */}
      {playerState.isDrifting && (
        <div className="self-center flex flex-col items-center animate-bounce">
          <div className="bg-fuchsia-950/80 border-2 border-fuchsia-500 rounded-full px-6 py-1.5 backdrop-blur-md shadow-lg shadow-fuchsia-900/60 flex items-center space-x-2">
            <span className="text-xs font-cyber tracking-widest text-fuchsia-300">DRIFTING</span>
            <span className="text-xl font-cyber font-black text-white">
              +{playerState.driftScore}
            </span>
            {playerState.driftMultiplier > 1 && (
              <span className="bg-fuchsia-500 text-black text-xs font-bold px-2 py-0.5 rounded-full font-cyber">
                x{playerState.driftMultiplier}
              </span>
            )}
          </div>
        </div>
      )}

      {/* BOTTOM UNIFIED DOCK (Unobstructed Viewport Discipline) */}
      <div className="pointer-events-auto self-center flex flex-col items-center w-full max-w-xl transition-all duration-300">
        {/* Collapse / Expand Toggle Tab */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="bg-slate-900/90 border border-b-0 border-cyan-500/30 hover:border-cyan-400 rounded-t-md px-3 py-1 text-slate-400 hover:text-cyan-300 text-xs font-tech flex items-center space-x-1 cursor-pointer transition-colors backdrop-blur-md"
        >
          {collapsed ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          <span>{collapsed ? 'SHOW HUD (H)' : 'HIDE HUD (H)'}</span>
        </button>

        {!collapsed && (
          <div className="w-full bg-slate-950/90 border border-cyan-500/40 rounded-xl p-4 backdrop-blur-md shadow-2xl shadow-cyan-950/80 flex flex-col space-y-3">
            {/* Upper row: Speedometer & Gear */}
            <div className="flex items-center justify-between">
              {/* Gear Display */}
              <div className="flex flex-col items-center">
                <span className="text-[10px] text-slate-400 font-cyber">GEAR</span>
                <span className="text-2xl font-black font-cyber text-cyan-300">
                  {playerState.gear === -1 ? 'R' : playerState.gear}
                </span>
              </div>

              {/* Main Digital Speedometer */}
              <div className="flex flex-col items-center">
                <div className="flex items-baseline space-x-1">
                  <span className="text-5xl font-black font-cyber text-white tracking-tight">
                    {playerState.speed}
                  </span>
                  <span className="text-xs font-cyber text-cyan-400 font-bold">KM/H</span>
                </div>
              </div>

              {/* Nitro Boost Action Button */}
              <button
                onClick={onNitroClick}
                className={`flex flex-col items-center justify-center px-4 py-1.5 rounded-lg border transition-all cursor-pointer ${
                  playerState.isBoosting
                    ? 'bg-cyan-500 text-slate-950 border-cyan-300 shadow-lg shadow-cyan-500/50'
                    : 'bg-cyan-950/60 hover:bg-cyan-900/80 text-cyan-300 border-cyan-500/50'
                }`}
              >
                <div className="flex items-center space-x-1 font-cyber font-bold text-xs">
                  <Zap className="w-3.5 h-3.5 fill-current" />
                  <span>NITRO</span>
                </div>
                <span className="text-[10px] font-cyber">{playerState.nitro}%</span>
              </button>
            </div>

            {/* Gauges row: RPM Bar + Nitro Bar */}
            <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-800">
              {/* RPM Gauge */}
              <div className="flex flex-col space-y-1">
                <div className="flex justify-between text-[10px] font-cyber text-slate-400">
                  <span>RPM</span>
                  <span>{playerState.rpm}</span>
                </div>
                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden flex">
                  <div
                    className={`h-full transition-all duration-75 ${
                      rpmPercent > 85 ? 'bg-red-500' : rpmPercent > 65 ? 'bg-amber-400' : 'bg-cyan-400'
                    }`}
                    style={{ width: `${rpmPercent}%` }}
                  />
                </div>
              </div>

              {/* Nitro Gauge */}
              <div className="flex flex-col space-y-1">
                <div className="flex justify-between text-[10px] font-cyber text-cyan-400">
                  <span>BOOST ENERGY</span>
                  <span>{playerState.nitro}%</span>
                </div>
                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden flex">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 via-cyan-400 to-fuchsia-500 transition-all duration-75"
                    style={{ width: `${nitroPercent}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
