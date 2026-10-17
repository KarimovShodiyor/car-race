import { CarSpecs } from '../../types/game';

export const CAR_CATALOG: CarSpecs[] = [
  {
    id: 'spectre-gt',
    name: 'SPECTRE GT 2099',
    tagline: 'Balanced Cyber Touring Supercar',
    topSpeed: 280,
    acceleration: 85,
    handling: 82,
    driftFactor: 0.85,
    nitroCapacity: 100,
    price: 0, // Unlocked by default
    unlocked: true,
    baseColor: '#06b6d4', // Cyan
    accentColor: '#3b82f6',
    modelStyle: 'cyber-gt',
  },
  {
    id: 'vortex-xr',
    name: 'VORTEX XR HYPER',
    tagline: 'Twin-Turbine Aerodynamic Interceptor',
    topSpeed: 330,
    acceleration: 96,
    handling: 78,
    driftFactor: 0.75,
    nitroCapacity: 120,
    price: 250,
    unlocked: false,
    baseColor: '#ec4899', // Magenta
    accentColor: '#8b5cf6',
    modelStyle: 'vortex-xr',
  },
  {
    id: 'cyber-phantom',
    name: 'PHANTOM DRIFT RS',
    tagline: 'High-Angle Cyber Drift Machine',
    topSpeed: 295,
    acceleration: 88,
    handling: 95,
    driftFactor: 1.15,
    nitroCapacity: 90,
    price: 500,
    unlocked: false,
    baseColor: '#a855f7', // Purple
    accentColor: '#06b6d4',
    modelStyle: 'phantom-x',
  },
  {
    id: 'apex-titan',
    name: 'APEX TITAN ZERO',
    tagline: 'Heavy Armored Supercharged Beast',
    topSpeed: 350,
    acceleration: 92,
    handling: 74,
    driftFactor: 0.7,
    nitroCapacity: 150,
    price: 1000,
    unlocked: false,
    baseColor: '#f59e0b', // Amber/Gold
    accentColor: '#ef4444',
    modelStyle: 'titan-apex',
  },
];

export const COLOR_PALETTE = [
  { name: 'Electric Cyan', hex: '#06b6d4', neon: '#22d3ee' },
  { name: 'Neon Magenta', hex: '#ec4899', neon: '#f472b6' },
  { name: 'Cyber Violet', hex: '#8b5cf6', neon: '#a78bfa' },
  { name: 'Solar Amber', hex: '#f59e0b', neon: '#fbbf24' },
  { name: 'Inferno Red', hex: '#ef4444', neon: '#f87171' },
  { name: 'Acid Green', hex: '#10b981', neon: '#34d399' },
  { name: 'Chrome Silver', hex: '#e2e8f0', neon: '#ffffff' },
  { name: 'Obsidian Black', hex: '#0f172a', neon: '#06b6d4' },
];
