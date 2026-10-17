import React from 'react';
import { X, Flag, Infinity, Clock, Flame, Compass, ShieldAlert } from 'lucide-react';
import { GameMode, Difficulty } from '../types/game';

interface ModeSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentMode: GameMode;
  currentDifficulty: Difficulty;
  onSelectMode: (mode: GameMode, diff: Difficulty) => void;
}

export const ModeSelectModal: React.FC<ModeSelectModalProps> = ({
  isOpen,
  onClose,
  currentMode,
  currentDifficulty,
  onSelectMode,
}) => {
  const [selectedMode, setSelectedMode] = React.useState<GameMode>(currentMode);
  const [selectedDiff, setSelectedDiff] = React.useState<Difficulty>(currentDifficulty);

  if (!isOpen) return null;

  const modes = [
    {
      id: 'career' as GameMode,
      name: 'CAREER GP',
      icon: Flag,
      color: 'text-cyan-400',
      border: 'border-cyan-500/50',
      desc: '3-lap competitive circuit race against 5 autonomous AI rivals. Earn prize credits for podium finishes.',
    },
    {
      id: 'endless' as GameMode,
      name: 'ENDLESS HIGHWAY',
      icon: Infinity,
      color: 'text-amber-400',
      border: 'border-amber-500/50',
      desc: 'Infinite 4-lane speedway through the neon skyline. Weave through civilian traffic and grab energy crystals.',
    },
    {
      id: 'drift' as GameMode,
      name: 'DRIFT CHALLENGE',
      icon: Flame,
      color: 'text-fuchsia-400',
      border: 'border-fuchsia-500/50',
      desc: 'Score massive drift points by sliding sideways through sharp corners with continuous combo multipliers.',
    },
    {
      id: 'timetrial' as GameMode,
      name: 'TIME TRIAL',
      icon: Clock,
      color: 'text-blue-400',
      border: 'border-blue-500/50',
      desc: 'Pure high-speed lap attack. Shave fractions of a second off your best lap records.',
    },
    {
      id: 'freedrive' as GameMode,
      name: 'FREE DRIVE',
      icon: Compass,
      color: 'text-emerald-400',
      border: 'border-emerald-500/50',
      desc: 'Cruise freely through the neon megacity without lap timers, rivals, or pressure.',
    },
  ];

  const handleStart = () => {
    onSelectMode(selectedMode, selectedDiff);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md select-none font-tech">
      <div className="w-full max-w-2xl bg-slate-900 border border-cyan-500/40 rounded-2xl p-6 shadow-2xl shadow-cyan-950/90 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex justify-between items-center pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-2xl font-black font-cyber text-white">
              SELECT <span className="text-cyan-400">MISSION</span>
            </h3>
            <p className="text-xs text-slate-400">Choose game mode and competition intensity</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Mode Cards */}
        <div className="flex-1 overflow-y-auto my-4 space-y-3 pr-1">
          {modes.map((m) => {
            const Icon = m.icon;
            const isSelected = selectedMode === m.id;
            return (
              <div
                key={m.id}
                onClick={() => setSelectedMode(m.id)}
                className={`p-4 rounded-xl border transition-all cursor-pointer flex items-start space-x-4 ${
                  isSelected
                    ? `bg-slate-800/80 ${m.border} shadow-lg shadow-cyan-950/50`
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div
                  className={`p-3 rounded-xl bg-slate-950 border border-slate-800 ${m.color}`}
                >
                  <Icon className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-cyber font-bold text-base text-white">{m.name}</h4>
                    {isSelected && (
                      <span className="text-[10px] font-cyber px-2 py-0.5 rounded bg-cyan-500 text-slate-950 font-bold">
                        SELECTED
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">{m.desc}</p>
                </div>
              </div>
            );
          })}

          {/* Difficulty selector */}
          <div className="mt-4 pt-4 border-t border-slate-800">
            <span className="text-xs font-cyber text-slate-400 flex items-center mb-2">
              <ShieldAlert className="w-3.5 h-3.5 mr-1 text-cyan-400" /> AI & TRAFFIC INTENSITY
            </span>
            <div className="grid grid-cols-3 gap-2">
              {(['easy', 'normal', 'hard'] as Difficulty[]).map((d) => (
                <button
                  key={d}
                  onClick={() => setSelectedDiff(d)}
                  className={`py-2 text-xs font-cyber rounded-lg border uppercase transition-all cursor-pointer ${
                    selectedDiff === d
                      ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-bold'
                      : 'bg-slate-800/50 text-slate-400 border-slate-700 hover:border-slate-600'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-800 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-400 hover:text-white text-sm font-cyber cursor-pointer"
          >
            CANCEL
          </button>
          <button
            onClick={handleStart}
            className="px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-cyber font-bold text-sm rounded-xl shadow-lg shadow-cyan-500/25 transition-all cursor-pointer"
          >
            START RACE
          </button>
        </div>
      </div>
    </div>
  );
};
