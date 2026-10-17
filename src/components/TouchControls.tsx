import React from 'react';
import { ChevronLeft, ChevronRight, ArrowUp, ArrowDown, Zap, Disc } from 'lucide-react';
import { VehicleInputs } from '../game/physics/VehicleController';

interface TouchControlsProps {
  onInputChange: (key: keyof VehicleInputs, value: boolean) => void;
}

export const TouchControls: React.FC<TouchControlsProps> = ({ onInputChange }) => {
  const handleTouch = (key: keyof VehicleInputs, isPressed: boolean) => {
    onInputChange(key, isPressed);
  };

  return (
    <div className="absolute inset-x-0 bottom-4 pointer-events-none flex justify-between items-end px-4 select-none z-30">
      {/* LEFT CLUSTER: Steering */}
      <div className="flex items-center space-x-3 pointer-events-auto">
        {/* Steer Left */}
        <button
          onTouchStart={(e) => {
            e.preventDefault();
            handleTouch('steerLeft', true);
          }}
          onTouchEnd={(e) => {
            e.preventDefault();
            handleTouch('steerLeft', false);
          }}
          onMouseDown={() => handleTouch('steerLeft', true)}
          onMouseUp={() => handleTouch('steerLeft', false)}
          className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-900/80 active:bg-cyan-500 active:text-slate-950 border border-cyan-500/50 rounded-2xl flex items-center justify-center text-cyan-300 backdrop-blur-md shadow-lg shadow-cyan-950/60 touch-none active:scale-95 transition-transform"
        >
          <ChevronLeft className="w-10 h-10" />
        </button>

        {/* Steer Right */}
        <button
          onTouchStart={(e) => {
            e.preventDefault();
            handleTouch('steerRight', true);
          }}
          onTouchEnd={(e) => {
            e.preventDefault();
            handleTouch('steerRight', false);
          }}
          onMouseDown={() => handleTouch('steerRight', true)}
          onMouseUp={() => handleTouch('steerRight', false)}
          className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-900/80 active:bg-cyan-500 active:text-slate-950 border border-cyan-500/50 rounded-2xl flex items-center justify-center text-cyan-300 backdrop-blur-md shadow-lg shadow-cyan-950/60 touch-none active:scale-95 transition-transform"
        >
          <ChevronRight className="w-10 h-10" />
        </button>
      </div>

      {/* RIGHT CLUSTER: Nitro, Handbrake, Brake/Reverse, Accelerate */}
      <div className="flex items-end space-x-3 pointer-events-auto">
        {/* Nitro & Handbrake Column */}
        <div className="flex flex-col space-y-2 mb-1">
          {/* Nitro */}
          <button
            onTouchStart={(e) => {
              e.preventDefault();
              handleTouch('nitro', true);
            }}
            onTouchEnd={(e) => {
              e.preventDefault();
              handleTouch('nitro', false);
            }}
            onMouseDown={() => handleTouch('nitro', true)}
            onMouseUp={() => handleTouch('nitro', false)}
            className="w-14 h-14 bg-gradient-to-tr from-cyan-600 to-blue-500 active:from-cyan-400 active:to-white border border-cyan-300 rounded-xl flex flex-col items-center justify-center text-white shadow-lg shadow-cyan-500/40 touch-none active:scale-95 transition-transform"
          >
            <Zap className="w-5 h-5 fill-current" />
            <span className="text-[9px] font-cyber font-bold">NITRO</span>
          </button>

          {/* Handbrake / Drift */}
          <button
            onTouchStart={(e) => {
              e.preventDefault();
              handleTouch('handbrake', true);
            }}
            onTouchEnd={(e) => {
              e.preventDefault();
              handleTouch('handbrake', false);
            }}
            onMouseDown={() => handleTouch('handbrake', true)}
            onMouseUp={() => handleTouch('handbrake', false)}
            className="w-14 h-14 bg-fuchsia-950/80 active:bg-fuchsia-600 border border-fuchsia-500/60 rounded-xl flex flex-col items-center justify-center text-fuchsia-300 active:text-white backdrop-blur-md shadow-lg touch-none active:scale-95 transition-transform"
          >
            <Disc className="w-5 h-5" />
            <span className="text-[9px] font-cyber font-bold">DRIFT</span>
          </button>
        </div>

        {/* Brake / Reverse */}
        <button
          onTouchStart={(e) => {
            e.preventDefault();
            handleTouch('brake', true);
          }}
          onTouchEnd={(e) => {
            e.preventDefault();
            handleTouch('brake', false);
          }}
          onMouseDown={() => handleTouch('brake', true)}
          onMouseUp={() => handleTouch('brake', false)}
          className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-900/80 active:bg-red-500 active:text-slate-950 border border-red-500/50 rounded-2xl flex flex-col items-center justify-center text-red-400 backdrop-blur-md shadow-lg shadow-red-950/60 touch-none active:scale-95 transition-transform"
        >
          <ArrowDown className="w-8 h-8" />
          <span className="text-[9px] font-cyber font-bold">BRAKE</span>
        </button>

        {/* Accelerate / Gas */}
        <button
          onTouchStart={(e) => {
            e.preventDefault();
            handleTouch('throttle', true);
          }}
          onTouchEnd={(e) => {
            e.preventDefault();
            handleTouch('throttle', false);
          }}
          onMouseDown={() => handleTouch('throttle', true)}
          onMouseUp={() => handleTouch('throttle', false)}
          className="w-18 h-20 sm:w-22 sm:h-24 bg-gradient-to-t from-emerald-950 to-slate-900 active:from-emerald-500 active:to-emerald-400 border-2 border-emerald-500/70 rounded-2xl flex flex-col items-center justify-center text-emerald-300 active:text-slate-950 backdrop-blur-md shadow-xl shadow-emerald-950/70 touch-none active:scale-95 transition-transform"
        >
          <ArrowUp className="w-10 h-10" />
          <span className="text-[10px] font-cyber font-black tracking-wider">DRIVE</span>
        </button>
      </div>
    </div>
  );
};
