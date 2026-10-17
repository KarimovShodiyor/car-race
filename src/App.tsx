import React, { useState, useEffect, useRef } from 'react';
import { GameEngine } from './game/GameEngine';
import { HUD } from './components/HUD';
import { TouchControls } from './components/TouchControls';
import { IntroScreen } from './components/IntroScreen';
import { GarageModal } from './components/GarageModal';
import { ModeSelectModal } from './components/ModeSelectModal';
import { SettingsModal } from './components/SettingsModal';
import { PauseModal } from './components/PauseModal';
import { ResultsModal } from './components/ResultsModal';
import { CAR_CATALOG } from './game/constants/cars';
import {
  GameMode,
  Difficulty,
  CameraView,
  CarSpecs,
  PlayerCarCustomization,
  GameSettings,
  PlayerState,
} from './types/game';
import { VehicleInputs } from './game/physics/VehicleController';
import { soundManager } from './audio/SoundManager';

const DEFAULT_SETTINGS: GameSettings = {
  soundVolume: 0.8,
  musicVolume: 0.5,
  graphicsQuality: 'high',
  sensitivity: 1.0,
  tiltControls: false,
};

const DEFAULT_CUSTOMIZATION: PlayerCarCustomization = {
  carId: 'spectre-gt',
  color: '#06b6d4',
  neonColor: '#22d3ee',
  wheelColor: '#cbd5e1',
};

const INITIAL_PLAYER_STATE: PlayerState = {
  speed: 0,
  rpm: 1000,
  gear: 1,
  nitro: 100,
  isBoosting: false,
  isDrifting: false,
  driftScore: 0,
  driftMultiplier: 1,
  driftAngle: 0,
  coins: 0,
  distance: 0,
  maxSpeed: 0,
  lap: 1,
  totalLaps: 3,
  lapTimes: [],
  currentLapTime: 0,
  bestLapTime: null,
  position: 1,
  totalRacers: 5,
  checkpointIndex: 0,
  health: 100,
  finished: false,
  crashed: false,
};

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<GameEngine | null>(null);

  // Game UI State
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [showGarage, setShowGarage] = useState<boolean>(false);
  const [showModes, setShowModes] = useState<boolean>(false);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [showResults, setShowResults] = useState<boolean>(false);
  const [isTouchDevice, setIsTouchDevice] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // Configuration State
  const [mode, setMode] = useState<GameMode>('career');
  const [difficulty, setDifficulty] = useState<Difficulty>('normal');
  const [cameraView, setCameraView] = useState<CameraView>('chase-close');
  const [selectedCar, setSelectedCar] = useState<CarSpecs>(CAR_CATALOG[0]);
  const [customization, setCustomization] = useState<PlayerCarCustomization>(DEFAULT_CUSTOMIZATION);
  const [settings, setSettings] = useState<GameSettings>(DEFAULT_SETTINGS);

  // Persistent Currency & Inventory
  const [totalCoins, setTotalCoins] = useState<number>(() => {
    const saved = localStorage.getItem('cyberpulse_coins');
    return saved ? parseInt(saved, 10) : 100; // 100 starter bonus
  });

  const [unlockedCarIds, setUnlockedCarIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('cyberpulse_unlocked_cars');
    return saved ? JSON.parse(saved) : ['spectre-gt'];
  });

  // Real-time HUD State
  const [playerState, setPlayerState] = useState<PlayerState>(INITIAL_PLAYER_STATE);

  // Race Results State
  const [raceResults, setRaceResults] = useState({
    position: 1,
    totalTime: 0,
    bestLapTime: null as number | null,
    coinsEarned: 0,
    distance: 0,
    maxSpeed: 0,
    driftScore: 0,
  });

  // Detect Touch screen device
  useEffect(() => {
    const checkTouch = () => {
      setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
    };
    checkTouch();
  }, []);

  // Save coins to localStorage
  useEffect(() => {
    localStorage.setItem('cyberpulse_coins', totalCoins.toString());
  }, [totalCoins]);

  // Save unlocked cars to localStorage
  useEffect(() => {
    localStorage.setItem('cyberpulse_unlocked_cars', JSON.stringify(unlockedCarIds));
  }, [unlockedCarIds]);

  // Initialize or Rebuild 3D Engine
  const initEngine = (targetMode: GameMode, targetDiff: Difficulty) => {
    if (!containerRef.current) return;

    if (engineRef.current) {
      engineRef.current.dispose();
      engineRef.current = null;
    }

    engineRef.current = new GameEngine(
      containerRef.current,
      targetMode,
      targetDiff,
      selectedCar,
      customization,
      {
        onStateUpdate: (state) => {
          setPlayerState(state);
        },
        onRaceFinish: (results) => {
          setRaceResults(results);
          setTotalCoins((prev) => prev + results.coinsEarned);
          setShowResults(true);
        },
        onCoinCollect: (collectedCoins) => {
          setTotalCoins((prev) => prev + 10);
        },
      }
    );

    engineRef.current.setGraphicsQuality(settings.graphicsQuality);
    engineRef.current.sensitivity = settings.sensitivity;
    engineRef.current.setCameraView(cameraView);
  };

  // Mount 3D Scene once on load
  useEffect(() => {
    initEngine(mode, difficulty);

    return () => {
      if (engineRef.current) {
        engineRef.current.dispose();
        engineRef.current = null;
      }
    };
  }, []);

  // Keyboard controls listener
  useEffect(() => {
    const activeInputs: Record<string, boolean> = {};

    const handleKeyDown = (e: KeyboardEvent) => {
      soundManager.ensureContextStarted();
      if (!engineRef.current) return;

      const key = e.key.toLowerCase();
      if (activeInputs[key]) return;
      activeInputs[key] = true;

      if (key === 'w' || key === 'arrowup') {
        engineRef.current.inputs.throttle = true;
      } else if (key === 's' || key === 'arrowdown') {
        engineRef.current.inputs.brake = true;
      } else if (key === 'a' || key === 'arrowleft') {
        engineRef.current.inputs.steerLeft = true;
      } else if (key === 'd' || key === 'arrowright') {
        engineRef.current.inputs.steerRight = true;
      } else if (key === ' ' || key === 'space') {
        e.preventDefault();
        engineRef.current.inputs.handbrake = true;
      } else if (key === 'shift') {
        engineRef.current.inputs.nitro = true;
      } else if (key === 'c') {
        // Toggle camera view
        toggleCamera();
      } else if (key === 'escape') {
        togglePause();
      } else if (key === 'r') {
        // Respawn / restart
        engineRef.current.restart();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (!engineRef.current) return;
      const key = e.key.toLowerCase();
      activeInputs[key] = false;

      if (key === 'w' || key === 'arrowup') {
        engineRef.current.inputs.throttle = false;
      } else if (key === 's' || key === 'arrowdown') {
        engineRef.current.inputs.brake = false;
      } else if (key === 'a' || key === 'arrowleft') {
        engineRef.current.inputs.steerLeft = false;
      } else if (key === 'd' || key === 'arrowright') {
        engineRef.current.inputs.steerRight = false;
      } else if (key === ' ' || key === 'space') {
        engineRef.current.inputs.handbrake = false;
      } else if (key === 'shift') {
        engineRef.current.inputs.nitro = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isPlaying, isPaused]);

  // Touch controls input bridge
  const handleTouchInputChange = (key: keyof VehicleInputs, value: boolean) => {
    soundManager.ensureContextStarted();
    if (engineRef.current) {
      engineRef.current.inputs[key] = value;
    }
  };

  const toggleCamera = () => {
    const views: CameraView[] = ['chase-close', 'chase-far', 'hood', 'top-down'];
    const nextIdx = (views.indexOf(cameraView) + 1) % views.length;
    const nextView = views[nextIdx];
    setCameraView(nextView);
    if (engineRef.current) {
      engineRef.current.setCameraView(nextView);
    }
  };

  const togglePause = () => {
    if (!isPlaying) return;
    if (isPaused) {
      setIsPaused(false);
      engineRef.current?.resume();
    } else {
      setIsPaused(true);
      engineRef.current?.pause();
    }
  };

  const handleStartRace = () => {
    soundManager.ensureContextStarted();
    soundManager.resumeAudio();
    setIsPlaying(true);
    setIsPaused(false);
    setShowResults(false);
    if (engineRef.current) {
      engineRef.current.restart();
    }
  };

  const handleSelectModeAndDiff = (newMode: GameMode, newDiff: Difficulty) => {
    setMode(newMode);
    setDifficulty(newDiff);
    initEngine(newMode, newDiff);
  };

  const handleSelectCar = (car: CarSpecs) => {
    setSelectedCar(car);
    if (engineRef.current) {
      engineRef.current.updateCar(car, customization);
    }
  };

  const handleUpdateCustomization = (custom: PlayerCarCustomization) => {
    setCustomization(custom);
    if (engineRef.current) {
      engineRef.current.updateCar(selectedCar, custom);
    }
  };

  const handleUnlockCar = (carId: string, cost: number) => {
    setTotalCoins((prev) => prev - cost);
    setUnlockedCarIds((prev) => [...prev, carId]);
  };

  const handleUpdateSettings = (newSettings: GameSettings) => {
    setSettings(newSettings);
    if (engineRef.current) {
      engineRef.current.setGraphicsQuality(newSettings.graphicsQuality);
      engineRef.current.sensitivity = newSettings.sensitivity;
    }
  };

  const handleMuteToggle = () => {
    if (isMuted) {
      soundManager.setSoundVolume(settings.soundVolume);
      soundManager.setMusicVolume(settings.musicVolume);
      setIsMuted(false);
    } else {
      soundManager.setSoundVolume(0);
      soundManager.setMusicVolume(0);
      setIsMuted(true);
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 font-tech">
      {/* 3D WEBGL CANVAS MOUNT REF */}
      <div ref={containerRef} className="absolute inset-0 z-0 touch-none" />

      {/* INTRO SCREEN (Before race start) */}
      {!isPlaying && (
        <IntroScreen
          onStartRace={handleStartRace}
          onOpenGarage={() => setShowGarage(true)}
          onOpenModes={() => setShowModes(true)}
          onOpenSettings={() => setShowSettings(true)}
          selectedCar={selectedCar}
          currentMode={mode}
          currentDifficulty={difficulty}
          totalCoins={totalCoins}
        />
      )}

      {/* IN-GAME HUD & TOUCH CONTROLS */}
      {isPlaying && !isPaused && !showResults && (
        <>
          <HUD
            playerState={playerState}
            mode={mode}
            cameraView={cameraView}
            onCameraToggle={toggleCamera}
            onPause={togglePause}
            onNitroClick={() => {
              if (engineRef.current) {
                engineRef.current.inputs.nitro = true;
                setTimeout(() => {
                  if (engineRef.current) engineRef.current.inputs.nitro = false;
                }, 1200);
              }
            }}
            isMuted={isMuted}
            onMuteToggle={handleMuteToggle}
          />

          {isTouchDevice && <TouchControls onInputChange={handleTouchInputChange} />}
        </>
      )}

      {/* PAUSE MODAL */}
      <PauseModal
        isOpen={isPaused}
        onResume={() => {
          setIsPaused(false);
          engineRef.current?.resume();
        }}
        onRestart={() => {
          setIsPaused(false);
          engineRef.current?.restart();
          engineRef.current?.resume();
        }}
        onOpenSettings={() => setShowSettings(true)}
        onOpenGarage={() => setShowGarage(true)}
        onMenu={() => {
          setIsPaused(false);
          setIsPlaying(false);
        }}
      />

      {/* GARAGE MODAL */}
      <GarageModal
        isOpen={showGarage}
        onClose={() => setShowGarage(false)}
        selectedCar={selectedCar}
        customization={customization}
        onSelectCar={handleSelectCar}
        onUpdateCustomization={handleUpdateCustomization}
        totalCoins={totalCoins}
        unlockedCarIds={unlockedCarIds}
        onUnlockCar={handleUnlockCar}
      />

      {/* MODE SELECT MODAL */}
      <ModeSelectModal
        isOpen={showModes}
        onClose={() => setShowModes(false)}
        currentMode={mode}
        currentDifficulty={difficulty}
        onSelectMode={handleSelectModeAndDiff}
      />

      {/* SETTINGS MODAL */}
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
      />

      {/* RACE RESULTS / VICTORY MODAL */}
      <ResultsModal
        isOpen={showResults}
        position={raceResults.position}
        totalTime={raceResults.totalTime}
        bestLapTime={raceResults.bestLapTime}
        coinsEarned={raceResults.coinsEarned}
        distance={raceResults.distance}
        maxSpeed={raceResults.maxSpeed}
        driftScore={raceResults.driftScore}
        onRestart={() => {
          setShowResults(false);
          handleStartRace();
        }}
        onOpenGarage={() => {
          setShowResults(false);
          setShowGarage(true);
        }}
        onMenu={() => {
          setShowResults(false);
          setIsPlaying(false);
        }}
      />
    </div>
  );
}
