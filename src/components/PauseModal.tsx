import React from 'react';
import { Play, RotateCcw, Settings, Home, Wrench } from 'lucide-react';

interface PauseModalProps {
  isOpen: boolean;
  onResume: () => void;
  onRestart: () => void;
  onOpenSettings: () => void;
  onOpenGarage: () => void;
  onMenu: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  isOpen,
  onResume,
  onRestart,
  onOpenSettings,
  onOpenGarage,
  onMenu,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md select-none font-tech">
      <div className="w-full max-w-sm bg-slate-900 border border-cyan-500/40 rounded-2xl p-6 shadow-2xl shadow-cyan-950/90 flex flex-col space-y-4">
        <div className="text-center pb-2 border-b border-slate-800">
          <h3 className="text-2xl font-black font-cyber text-white">RACE PAUSED</h3>
          <p className="text-xs text-slate-400">Simulation suspended</p>
        </div>

        <div className="flex flex-col space-y-2 pt-2">
          {/* Resume */}
          <button
            onClick={onResume}
            className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-cyber font-bold text-sm rounded-xl shadow-lg shadow-cyan-500/25 flex items-center justify-center space-x-2 transition-all cursor-pointer"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>RESUME RACE</span>
          </button>

          {/* Restart */}
          <button
            onClick={onRestart}
            className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-cyber font-bold text-xs rounded-xl border border-slate-700 flex items-center justify-center space-x-2 transition-all cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 text-cyan-400" />
            <span>RESTART EVENT</span>
          </button>

          {/* Garage */}
          <button
            onClick={onOpenGarage}
            className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-cyber font-bold text-xs rounded-xl border border-slate-700 flex items-center justify-center space-x-2 transition-all cursor-pointer"
          >
            <Wrench className="w-4 h-4 text-cyan-400" />
            <span>CYBER GARAGE</span>
          </button>

          {/* Settings */}
          <button
            onClick={onOpenSettings}
            className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-cyber font-bold text-xs rounded-xl border border-slate-700 flex items-center justify-center space-x-2 transition-all cursor-pointer"
          >
            <Settings className="w-4 h-4 text-slate-400" />
            <span>SETTINGS</span>
          </button>

          {/* Main Menu */}
          <button
            onClick={onMenu}
            className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white font-cyber font-bold text-xs rounded-xl border border-slate-800 flex items-center justify-center space-x-2 transition-all cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>MAIN MENU</span>
          </button>
        </div>
      </div>
    </div>
  );
};
