import React, { useState } from 'react';
import { X, Lock, Check, Zap, Gauge, Wind, Disc } from 'lucide-react';
import { CarSpecs, PlayerCarCustomization } from '../types/game';
import { CAR_CATALOG, COLOR_PALETTE } from '../game/constants/cars';
import { soundManager } from '../audio/SoundManager';

interface GarageModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCar: CarSpecs;
  customization: PlayerCarCustomization;
  onSelectCar: (car: CarSpecs) => void;
  onUpdateCustomization: (custom: PlayerCarCustomization) => void;
  totalCoins: number;
  unlockedCarIds: string[];
  onUnlockCar: (carId: string, cost: number) => void;
}

export const GarageModal: React.FC<GarageModalProps> = ({
  isOpen,
  onClose,
  selectedCar,
  customization,
  onSelectCar,
  onUpdateCustomization,
  totalCoins,
  unlockedCarIds,
  onUnlockCar,
}) => {
  const [activeTab, setActiveTab] = useState<'vehicles' | 'paint' | 'neon'>('vehicles');

  if (!isOpen) return null;

  const isCarUnlocked = (id: string) => unlockedCarIds.includes(id) || id === 'spectre-gt';

  const handleCarClick = (car: CarSpecs) => {
    soundManager.ensureContextStarted();
    soundManager.playTone(440, 660, 0.1, 'triangle', 0.15);
    if (isCarUnlocked(car.id)) {
      onSelectCar(car);
      onUpdateCustomization({
        ...customization,
        carId: car.id,
      });
    }
  };

  const handleUnlock = (car: CarSpecs) => {
    if (totalCoins >= car.price) {
      soundManager.playCoinSound();
      onUnlockCar(car.id, car.price);
      onSelectCar(car);
      onUpdateCustomization({
        ...customization,
        carId: car.id,
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md select-none font-tech">
      <div className="w-full max-w-4xl bg-slate-900 border border-cyan-500/40 rounded-2xl p-6 shadow-2xl shadow-cyan-950/90 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex justify-between items-center pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <span className="text-2xl font-black font-cyber text-white tracking-wide">
              CYBER <span className="text-cyan-400">GARAGE</span>
            </span>
            <div className="bg-amber-500/10 border border-amber-500/40 px-3 py-1 rounded-full text-amber-400 font-cyber font-bold text-xs flex items-center space-x-1">
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>{totalCoins} CREDITS</span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-2 my-4">
          <button
            onClick={() => setActiveTab('vehicles')}
            className={`flex-1 py-2 font-cyber text-xs tracking-wider rounded-lg border transition-all cursor-pointer ${
              activeTab === 'vehicles'
                ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-bold shadow-lg shadow-cyan-500/20'
                : 'bg-slate-800/60 text-slate-300 border-slate-700 hover:border-slate-600'
            }`}
          >
            VEHICLE ROSTER
          </button>
          <button
            onClick={() => setActiveTab('paint')}
            className={`flex-1 py-2 font-cyber text-xs tracking-wider rounded-lg border transition-all cursor-pointer ${
              activeTab === 'paint'
                ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-bold shadow-lg shadow-cyan-500/20'
                : 'bg-slate-800/60 text-slate-300 border-slate-700 hover:border-slate-600'
            }`}
          >
            HULL FINISH
          </button>
          <button
            onClick={() => setActiveTab('neon')}
            className={`flex-1 py-2 font-cyber text-xs tracking-wider rounded-lg border transition-all cursor-pointer ${
              activeTab === 'neon'
                ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-bold shadow-lg shadow-cyan-500/20'
                : 'bg-slate-800/60 text-slate-300 border-slate-700 hover:border-slate-600'
            }`}
          >
            NEON UNDERGLOW
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto pr-1">
          {activeTab === 'vehicles' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {CAR_CATALOG.map((car) => {
                const unlocked = isCarUnlocked(car.id);
                const isSelected = selectedCar.id === car.id;

                return (
                  <div
                    key={car.id}
                    onClick={() => handleCarClick(car)}
                    className={`relative p-4 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-cyan-950/40 border-cyan-400 shadow-lg shadow-cyan-950/50'
                        : 'bg-slate-800/40 border-slate-700/70 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-cyber font-bold text-base text-white">{car.name}</h4>
                        <p className="text-xs text-slate-400">{car.tagline}</p>
                      </div>
                      {isSelected ? (
                        <div className="bg-cyan-500 text-slate-950 p-1 rounded-md">
                          <Check className="w-4 h-4 font-bold" />
                        </div>
                      ) : !unlocked ? (
                        <div className="bg-slate-800 text-amber-400 p-1.5 rounded-md flex items-center space-x-1 text-xs font-cyber">
                          <Lock className="w-3.5 h-3.5" />
                          <span>{car.price} CR</span>
                        </div>
                      ) : null}
                    </div>

                    {/* Stats Bars */}
                    <div className="space-y-2 mt-4 text-xs font-cyber text-slate-300">
                      <div>
                        <div className="flex justify-between mb-0.5">
                          <span className="flex items-center text-slate-400">
                            <Gauge className="w-3.5 h-3.5 mr-1 text-cyan-400" /> TOP SPEED
                          </span>
                          <span className="font-bold text-cyan-300">{car.topSpeed} KM/H</span>
                        </div>
                        <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-cyan-400"
                            style={{ width: `${(car.topSpeed / 360) * 100}%` }}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between mb-0.5">
                          <span className="flex items-center text-slate-400">
                            <Wind className="w-3.5 h-3.5 mr-1 text-fuchsia-400" /> ACCELERATION
                          </span>
                          <span className="font-bold text-fuchsia-300">{car.acceleration}/100</span>
                        </div>
                        <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-fuchsia-400"
                            style={{ width: `${car.acceleration}%` }}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between mb-0.5">
                          <span className="flex items-center text-slate-400">
                            <Disc className="w-3.5 h-3.5 mr-1 text-emerald-400" /> DRIFT CONTROL
                          </span>
                          <span className="font-bold text-emerald-300">{car.handling}/100</span>
                        </div>
                        <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-400"
                            style={{ width: `${car.handling}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Unlock action button if locked */}
                    {!unlocked && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUnlock(car);
                        }}
                        disabled={totalCoins < car.price}
                        className={`mt-4 w-full py-2 rounded-lg font-cyber font-bold text-xs flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
                          totalCoins >= car.price
                            ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/20'
                            : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        }`}
                      >
                        <Lock className="w-3.5 h-3.5" />
                        <span>UNLOCK FOR {car.price} CREDITS</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'paint' && (
            <div className="space-y-4">
              <p className="text-sm text-slate-300">
                Select high-gloss metallic finish for the vehicle body:
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {COLOR_PALETTE.map((color) => {
                  const isCurrent = customization.color === color.hex;
                  return (
                    <button
                      key={color.name}
                      onClick={() => {
                        onUpdateCustomization({
                          ...customization,
                          color: color.hex,
                        });
                      }}
                      className={`p-3 rounded-xl border flex flex-col items-center space-y-2 transition-all cursor-pointer ${
                        isCurrent
                          ? 'bg-slate-800 border-cyan-400 shadow-md shadow-cyan-500/20'
                          : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div
                        className="w-12 h-12 rounded-full border-2 border-white/20 shadow-inner"
                        style={{ backgroundColor: color.hex }}
                      />
                      <span className="text-xs font-cyber text-slate-200">{color.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'neon' && (
            <div className="space-y-4">
              <p className="text-sm text-slate-300">
                Select vibrant LED neon glow under the chassis:
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {COLOR_PALETTE.map((color) => {
                  const isCurrent = customization.neonColor === color.neon;
                  return (
                    <button
                      key={color.name}
                      onClick={() => {
                        onUpdateCustomization({
                          ...customization,
                          neonColor: color.neon,
                        });
                      }}
                      className={`p-3 rounded-xl border flex flex-col items-center space-y-2 transition-all cursor-pointer ${
                        isCurrent
                          ? 'bg-slate-800 border-cyan-400 shadow-md shadow-cyan-500/20'
                          : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div
                        className="w-12 h-12 rounded-full shadow-lg"
                        style={{
                          backgroundColor: color.neon,
                          boxShadow: `0 0 15px ${color.neon}`,
                        }}
                      />
                      <span className="text-xs font-cyber text-slate-200">{color.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="pt-4 mt-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-cyber font-bold text-sm rounded-xl shadow-lg shadow-cyan-500/25 transition-all cursor-pointer"
          >
            CONFIRM & RETURN
          </button>
        </div>
      </div>
    </div>
  );
};
