export type GameMode = 'career' | 'endless' | 'timetrial' | 'drift' | 'freedrive';

export type Difficulty = 'easy' | 'normal' | 'hard';

export type CameraView = 'chase-close' | 'chase-far' | 'hood' | 'top-down';

export type GraphicsQuality = 'low' | 'medium' | 'high';

export interface CarSpecs {
  id: string;
  name: string;
  tagline: string;
  topSpeed: number; // km/h
  acceleration: number; // 0-100 rating
  handling: number; // agility rating
  driftFactor: number; // drift slip multiplier
  nitroCapacity: number; // max boost seconds
  price: number; // unlocked or coins needed
  unlocked: boolean;
  baseColor: string;
  accentColor: string;
  modelStyle: 'cyber-gt' | 'vortex-xr' | 'phantom-x' | 'titan-apex';
}

export interface PlayerCarCustomization {
  carId: string;
  color: string;
  neonColor: string;
  wheelColor: string;
}

export interface PlayerState {
  speed: number; // km/h
  rpm: number; // 0 - 9000
  gear: number; // 1-6 or -1 (reverse)
  nitro: number; // 0 - 100
  isBoosting: boolean;
  isDrifting: boolean;
  driftScore: number;
  driftMultiplier: number;
  driftAngle: number;
  coins: number;
  distance: number;
  maxSpeed: number;
  lap: number;
  totalLaps: number;
  lapTimes: number[];
  currentLapTime: number;
  bestLapTime: number | null;
  position: number;
  totalRacers: number;
  checkpointIndex: number;
  health: number; // 0 - 100
  finished: boolean;
  crashed: boolean;
}

export interface AIRacer {
  id: string;
  name: string;
  carModel: string;
  color: string;
  progress: number; // 0 to 1 around track or distance on highway
  speed: number;
  targetSpeed: number;
  lane: number;
  x: number;
  z: number;
  rotationY: number;
  meshGroup?: any;
}

export interface TrafficVehicle {
  id: number;
  lane: number;
  speed: number;
  x: number;
  z: number;
  color: string;
  modelType: number;
}

export interface EnergyCoin {
  id: number;
  x: number;
  y: number;
  z: number;
  collected: boolean;
  rotation: number;
}

export interface GameSettings {
  soundVolume: number;
  musicVolume: number;
  graphicsQuality: GraphicsQuality;
  sensitivity: number;
  tiltControls: boolean;
}
