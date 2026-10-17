import React from 'react';
import { X, Volume2, Music, Monitor, Sliders, Keyboard } from 'lucide-react';
import { GameSettings, GraphicsQuality } from '../types/game';
import { soundManager } from '../audio/SoundManager';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: GameSettings;
  onUpdateSettings: (settings: GameSettings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
}) => {
  if (!isOpen) return null;

  const handleSoundChange = (val: number) => {
    soundManager.setSoundVolume(val);
    onUpdateSettings({ ...settings, soundVolume: val });
  };

  const handleMusicChange = (val: number) => {
    soundManager.setMusicVolume(val);
    onUpdateSettings({ ...settings, musicVolume: val });
  };

  const handleGraphicsChange = (quality: GraphicsQuality) => {
    onUpdateSettings({ ...settings, graphicsQuality: quality });
  };

  const handleSensitivityChange = (val: number) => {
    onUpdateSettings({ ...settings, sensitivity: val });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md select-none font-tech">
      <div className="w-full max-w-xl bg-slate-900 border border-cyan-500/40 rounded-2xl p-6 shadow-2xl shadow-cyan-950/90 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex justify-between items-center pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <Sliders className="w-5 h-5 text-cyan-400" />
            <h3 className="text-xl font-black font-cyber text-white">SYSTEM SETTINGS</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Settings Body */}
        <div className="flex-1 overflow-y-auto my-4 space-y-5 pr-1">
          {/* SFX Volume */}
          <div className="space-y-1">
            <div className="flex justify-between items-center text-xs font-cyber text-slate-300">
              <span className="flex items-center">
                <Volume2 className="w-4 h-4 mr-1 text-cyan-400" /> ENGINE & SFX VOLUME
              </span>
              <span className="text-cyan-400 font-bold">{Math.round(settings.soundVolume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={settings.soundVolume}
              onChange={(e) => handleSoundChange(parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
          </div>

          {/* Music Volume */}
          <div className="space-y-1">
            <div className="flex justify-between items-center text-xs font-cyber text-slate-300">
              <span className="flex items-center">
                <Music className="w-4 h-4 mr-1 text-fuchsia-400" /> SYNTHWAVE MUSIC VOLUME
              </span>
              <span className="text-fuchsia-400 font-bold">{Math.round(settings.musicVolume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={settings.musicVolume}
              onChange={(e) => handleMusicChange(parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-fuchsia-400"
            />
          </div>

          {/* Graphics Quality */}
          <div className="space-y-2">
            <span className="text-xs font-cyber text-slate-300 flex items-center">
              <Monitor className="w-4 h-4 mr-1 text-amber-400" /> GRAPHICS FIDELITY
            </span>
            <div className="grid grid-cols-3 gap-2">
              {(['low', 'medium', 'high'] as GraphicsQuality[]).map((q) => (
                <button
                  key={q}
                  onClick={() => handleGraphicsChange(q)}
                  className={`py-2 text-xs font-cyber rounded-lg border uppercase transition-all cursor-pointer ${
                    settings.graphicsQuality === q
                      ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold shadow-md shadow-amber-500/20'
                      : 'bg-slate-800/50 text-slate-400 border-slate-700 hover:border-slate-600'
                  }`}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Steering Sensitivity */}
          <div className="space-y-1">
            <div className="flex justify-between items-center text-xs font-cyber text-slate-300">
              <span>STEERING SENSITIVITY</span>
              <span className="text-cyan-400 font-bold">{settings.sensitivity.toFixed(1)}x</span>
            </div>
            <input
              type="range"
              min="0.6"
              max="1.8"
              step="0.1"
              value={settings.sensitivity}
              onChange={(e) => handleSensitivityChange(parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
          </div>

          {/* Controls Quick Ref */}
          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2">
            <span className="text-xs font-cyber text-slate-400 flex items-center">
              <Keyboard className="w-3.5 h-3.5 mr-1 text-slate-400" /> DESKTOP KEYBOARD CONTROLS
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs text-slate-300">
              <div><span className="font-mono text-cyan-400 font-bold">W / ↑</span> : Accelerate</div>
              <div><span className="font-mono text-cyan-400 font-bold">S / ↓</span> : Brake / Reverse</div>
              <div><span className="font-mono text-cyan-400 font-bold">A / D</span> : Steer Left / Right</div>
              <div><span className="font-mono text-cyan-400 font-bold">SPACE</span> : Drift Handbrake</div>
              <div><span className="font-mono text-cyan-400 font-bold">SHIFT</span> : Nitro Boost</div>
              <div><span className="font-mono text-cyan-400 font-bold">C / H</span> : Camera / Toggle HUD</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-cyber font-bold text-xs rounded-lg transition-colors cursor-pointer"
          >
            SAVE & CLOSE
          </button>
        </div>
      </div>
    </div>
  );
};
