import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import {
  GameMode,
  Difficulty,
  CameraView,
  GraphicsQuality,
  PlayerState,
  CarSpecs,
  PlayerCarCustomization,
} from '../types/game';
import { createCyberCar, CarVisualGroup } from './geometry/CarModels';
import { CityEnvironment } from './geometry/CityEnvironment';
import { TrackManager } from './geometry/TrackManager';
import { VehicleController, VehicleInputs } from './physics/VehicleController';
import { AIOpponents } from './systems/AIOpponents';
import { ParticleSystem } from './systems/ParticleSystem';
import { soundManager } from '../audio/SoundManager';

export interface GameEngineCallbacks {
  onStateUpdate: (state: PlayerState) => void;
  onRaceFinish: (results: {
    position: number;
    lapTimes: number[];
    bestLapTime: number | null;
    totalTime: number;
    driftScore: number;
    coinsEarned: number;
    distance: number;
    maxSpeed: number;
  }) => void;
  onCoinCollect: (coins: number) => void;
}

export class GameEngine {
  private container: HTMLElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private clock: THREE.Clock;
  private animFrameId: number | null = null;

  // Game configuration
  public mode: GameMode;
  public difficulty: Difficulty;
  public cameraView: CameraView = 'chase-close';
  public graphicsQuality: GraphicsQuality = 'high';
  public sensitivity: number = 1.0;

  // World & Systems
  private city: CityEnvironment;
  private trackManager: TrackManager;
  private aiOpponents: AIOpponents | null = null;
  private particleSystem: ParticleSystem;

  // Player Vehicle
  private playerCarGroup: CarVisualGroup;
  private vehicleController: VehicleController;
  public currentSpecs: CarSpecs;
  public customization: PlayerCarCustomization;

  // Lighting
  private dirLight: THREE.DirectionalLight;
  private hemiLight: THREE.HemisphereLight;

  // Race State
  private totalLaps: number = 3;
  private currentLap: number = 1;
  private currentLapTime: number = 0;
  private lapTimes: number[] = [];
  private bestLapTime: number | null = null;
  private totalRaceTime: number = 0;
  private passedCheckpoints: Set<number> = new Set();
  private raceFinished: boolean = false;
  private isPaused: boolean = false;

  // Camera Shake
  private cameraShakeIntensity: number = 0;

  // Input State
  public inputs: VehicleInputs = {
    throttle: false,
    brake: false,
    steerLeft: false,
    steerRight: false,
    handbrake: false,
    nitro: false,
  };

  private callbacks: GameEngineCallbacks;
  private lastUiUpdate: number = 0;

  constructor(
    container: HTMLElement,
    mode: GameMode,
    difficulty: Difficulty,
    specs: CarSpecs,
    customization: PlayerCarCustomization,
    callbacks: GameEngineCallbacks
  ) {
    this.container = container;
    this.mode = mode;
    this.difficulty = difficulty;
    this.currentSpecs = specs;
    this.customization = customization;
    this.callbacks = callbacks;
    this.clock = new THREE.Clock();

    // 1. Scene & Atmosphere
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x030712);
    this.scene.fog = new THREE.FogExp2(0x050814, 0.0035);

    // 2. Camera
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(60, width / height, 0.5, 900);

    // 3. Renderer with ACES ToneMapping & PBR Setup
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      stencil: false,
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(this.renderer.domElement);

    // 4. RoomEnvironment for High-Fidelity Metallic Reflections
    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // 5. Lighting Setup
    this.hemiLight = new THREE.HemisphereLight(0x38bdf8, 0x1e1b4b, 0.9);
    this.scene.add(this.hemiLight);

    this.dirLight = new THREE.DirectionalLight(0xe0f2fe, 1.8);
    this.dirLight.position.set(40, 65, 30);
    this.dirLight.castShadow = true;
    this.dirLight.shadow.mapSize.width = 1024;
    this.dirLight.shadow.mapSize.height = 1024;
    this.dirLight.shadow.camera.near = 10;
    this.dirLight.shadow.camera.far = 150;
    this.dirLight.shadow.camera.left = -40;
    this.dirLight.shadow.camera.right = 40;
    this.dirLight.shadow.camera.top = 40;
    this.dirLight.shadow.camera.bottom = -40;
    this.dirLight.shadow.bias = -0.0005;
    this.dirLight.shadow.normalBias = 0.02;
    this.scene.add(this.dirLight);

    // Ambient Cyber Point Lights
    const neonPoint1 = new THREE.PointLight(0x06b6d4, 1.2, 80);
    neonPoint1.position.set(-15, 8, 20);
    this.scene.add(neonPoint1);

    const neonPoint2 = new THREE.PointLight(0xec4899, 1.2, 80);
    neonPoint2.position.set(15, 8, 20);
    this.scene.add(neonPoint2);

    // 6. City Environment & Track
    this.city = new CityEnvironment();
    this.scene.add(this.city.rootGroup);

    this.trackManager = new TrackManager(this.mode);
    this.scene.add(this.trackManager.rootGroup);

    // 7. Player Car
    this.playerCarGroup = createCyberCar(
      this.currentSpecs.modelStyle,
      this.customization.color,
      this.customization.neonColor,
      this.customization.wheelColor
    );
    this.scene.add(this.playerCarGroup);
    this.vehicleController = new VehicleController(this.currentSpecs, this.playerCarGroup);

    // Setup initial position
    this.resetPlayerToStart();

    // 8. AI Opponents (Circuit & Career Modes)
    if (this.mode === 'career' || this.mode === 'timetrial') {
      const aiCount = this.mode === 'timetrial' ? 1 : 4;
      this.aiOpponents = new AIOpponents(this.difficulty, aiCount);
      if (this.trackManager.trackSpline) {
        this.aiOpponents.setTrackSpline(this.trackManager.trackSpline);
      }
      this.scene.add(this.aiOpponents.rootGroup);
    }

    // 9. Particle System
    this.particleSystem = new ParticleSystem();
    this.scene.add(this.particleSystem.rootGroup);

    // Window Resize Handler
    window.addEventListener('resize', this.onResize);

    // Pre-warm shaders
    this.renderer.compile(this.scene, this.camera);

    // Start Audio Music
    soundManager.startMusic();

    // Start Game Loop
    this.startLoop();
  }

  private resetPlayerToStart() {
    if (this.mode === 'endless') {
      this.vehicleController.setPosition(0, 0, 0, 0);
    } else if (this.trackManager.trackSpline) {
      const startPt = this.trackManager.trackSpline.getPointAt(0);
      const tangent = this.trackManager.trackSpline.getTangentAt(0).normalize();
      const heading = Math.atan2(tangent.x, tangent.z);
      this.vehicleController.setPosition(startPt.x, startPt.y, startPt.z, heading);
    }
  }

  public updateCar(specs: CarSpecs, customization: PlayerCarCustomization) {
    this.currentSpecs = specs;
    this.customization = customization;

    this.scene.remove(this.playerCarGroup);
    this.playerCarGroup = createCyberCar(
      specs.modelStyle,
      customization.color,
      customization.neonColor,
      customization.wheelColor
    );
    this.scene.add(this.playerCarGroup);

    const oldPos = this.vehicleController.position.clone();
    const oldRot = this.vehicleController.rotationY;
    this.vehicleController = new VehicleController(specs, this.playerCarGroup);
    this.vehicleController.setPosition(oldPos.x, oldPos.y, oldPos.z, oldRot);
  }

  public setCameraView(view: CameraView) {
    this.cameraView = view;
  }

  public setDifficulty(diff: Difficulty) {
    this.difficulty = diff;
    if (this.aiOpponents && this.trackManager.trackSpline) {
      this.scene.remove(this.aiOpponents.rootGroup);
      this.aiOpponents = new AIOpponents(diff, this.mode === 'timetrial' ? 1 : 4);
      this.aiOpponents.setTrackSpline(this.trackManager.trackSpline);
      this.scene.add(this.aiOpponents.rootGroup);
    }
  }

  public setGraphicsQuality(quality: GraphicsQuality) {
    this.graphicsQuality = quality;
    if (quality === 'low') {
      this.renderer.setPixelRatio(1);
      this.renderer.shadowMap.enabled = false;
      this.scene.fog = new THREE.FogExp2(0x050814, 0.005);
    } else if (quality === 'medium') {
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
      this.renderer.shadowMap.enabled = true;
      this.dirLight.shadow.mapSize.set(512, 512);
    } else {
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      this.renderer.shadowMap.enabled = true;
      this.dirLight.shadow.mapSize.set(1024, 1024);
    }
  }

  public pause() {
    this.isPaused = true;
    soundManager.pauseAudio();
  }

  public resume() {
    this.isPaused = false;
    soundManager.resumeAudio();
    this.clock.getDelta(); // flush delta
  }

  public restart() {
    this.raceFinished = false;
    this.currentLap = 1;
    this.currentLapTime = 0;
    this.lapTimes = [];
    this.totalRaceTime = 0;
    this.passedCheckpoints.clear();
    this.resetPlayerToStart();
    if (this.aiOpponents) {
      this.aiOpponents.resetPositions();
    }
  }

  private onResize = () => {
    if (!this.container) return;
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  };

  private startLoop() {
    const loop = () => {
      this.animFrameId = requestAnimationFrame(loop);
      if (!this.isPaused) {
        const delta = this.clock.getDelta();
        this.update(delta);
      }
      this.renderer.render(this.scene, this.camera);
    };
    loop();
  }

  private update(delta: number) {
    // 1. Vehicle Physics
    this.vehicleController.update(this.inputs, delta, this.sensitivity);

    // 2. City & Sky Traffic
    this.city.update(delta);

    // 3. AI Opponents
    if (this.aiOpponents) {
      this.aiOpponents.update(delta);
    }

    // 4. Track & Gameplay Mechanics
    if (this.mode === 'endless') {
      this.updateEndlessMode(delta);
    } else {
      this.updateCircuitMode(delta);
    }

    // 5. Particles & Speed Lines
    this.updateParticles(delta);

    // 6. Camera Tracking
    this.updateCamera(delta);

    // 7. Light Follows Car
    this.dirLight.position.set(
      this.vehicleController.position.x + 35,
      this.vehicleController.position.y + 60,
      this.vehicleController.position.z + 25
    );
    this.dirLight.target = this.playerCarGroup;

    // 8. Notify React UI state (throttled ~30fps for zero frame drops)
    const now = performance.now();
    if (now - this.lastUiUpdate > 33) {
      this.lastUiUpdate = now;
      this.callbacks.onStateUpdate(this.buildPlayerState());
    }
  }

  private updateEndlessMode(delta: number) {
    const pZ = this.vehicleController.position.z;
    const pX = this.vehicleController.position.x;
    this.trackManager.updateEndless(pZ, delta);

    // Highway barrier collision check (Width ~26m, so X between -12.5 and +12.5)
    if (Math.abs(pX) > 12.0) {
      this.vehicleController.position.x = Math.sign(pX) * 11.9;
      this.vehicleController.triggerCollision(12);
      this.cameraShakeIntensity = 0.5;
      this.particleSystem.emitCollision(this.vehicleController.position);
    }

    // Collect Energy Coins
    for (const coin of this.trackManager.coins) {
      if (!coin.collected && Math.abs(coin.z - pZ) < 3.2 && Math.abs(coin.x - pX) < 2.2) {
        coin.collected = true;
        this.vehicleController.coinsCollected += 10;
        this.vehicleController.nitro = Math.min(
          this.currentSpecs.nitroCapacity,
          this.vehicleController.nitro + 25
        );
        soundManager.playCoinSound();
        this.callbacks.onCoinCollect(this.vehicleController.coinsCollected);
      }
    }

    // Highway Traffic Collisions
    for (const t of this.trackManager.traffic) {
      if (Math.abs(t.z - pZ) < 4.5 && Math.abs(t.x - pX) < 2.4) {
        this.vehicleController.triggerCollision(18);
        this.cameraShakeIntensity = 0.8;
        this.particleSystem.emitCollision(this.vehicleController.position);
        t.z += 8; // Bump traffic ahead
      }
    }
  }

  private updateCircuitMode(delta: number) {
    if (!this.trackManager.trackSpline) return;

    this.currentLapTime += delta;
    this.totalRaceTime += delta;

    // Find closest point on spline to calculate progress
    const playerPos = this.vehicleController.position;
    const trackSpline = this.trackManager.trackSpline;

    // Check distance to finish line gate
    const finishPt = trackSpline.getPointAt(0);
    const distToFinish = playerPos.distanceTo(finishPt);

    // If passed all checkpoints and near finish gate -> complete lap!
    if (distToFinish < 14 && this.passedCheckpoints.size >= 3) {
      this.lapTimes.push(this.currentLapTime);
      if (!this.bestLapTime || this.currentLapTime < this.bestLapTime) {
        this.bestLapTime = this.currentLapTime;
      }
      soundManager.playCheckpointSound();

      if (this.currentLap >= this.totalLaps) {
        // Race completed!
        this.raceFinished = true;
        const finalPos = this.calculatePosition();
        const coinsWon = finalPos === 1 ? 500 : finalPos === 2 ? 300 : finalPos === 3 ? 150 : 50;
        this.callbacks.onRaceFinish({
          position: finalPos,
          lapTimes: this.lapTimes,
          bestLapTime: this.bestLapTime,
          totalTime: this.totalRaceTime,
          driftScore: this.vehicleController.driftScore,
          coinsEarned: coinsWon,
          distance: Math.round(this.vehicleController.totalDistance),
          maxSpeed: this.vehicleController.maxSpeedReached,
        });
      } else {
        this.currentLap++;
        this.currentLapTime = 0;
        this.passedCheckpoints.clear();
      }
    }

    // Check intermediate checkpoints
    const checkpointRatios = [0.25, 0.5, 0.75];
    checkpointRatios.forEach((ratio, idx) => {
      if (!this.passedCheckpoints.has(idx)) {
        const cpPt = trackSpline.getPointAt(ratio);
        if (playerPos.distanceTo(cpPt) < 16) {
          this.passedCheckpoints.add(idx);
          soundManager.playCheckpointSound();
        }
      }
    });
  }

  private calculatePosition(): number {
    if (!this.aiOpponents || !this.trackManager.trackSpline) return 1;

    // Compare player progress against AI racers
    let position = 1;
    const pPos = this.vehicleController.position;
    const playerProgress = (this.currentLap - 1) + (this.passedCheckpoints.size * 0.25);

    for (const ai of this.aiOpponents.racers) {
      const aiScore = (this.currentLap - 1) + ai.progress;
      if (aiScore > playerProgress + 0.05) {
        position++;
      }
    }
    return Math.min(position, (this.aiOpponents?.racers.length || 0) + 1);
  }

  private updateParticles(delta: number) {
    const pPos = this.vehicleController.position;
    const carHeading = new THREE.Vector3(
      Math.sin(this.vehicleController.rotationY),
      0,
      Math.cos(this.vehicleController.rotationY)
    );

    // Nitro exhaust emitter
    if (this.vehicleController.isBoosting) {
      const rearPos = pPos.clone().sub(carHeading.clone().multiplyScalar(2.2));
      this.particleSystem.emitNitro(rearPos, carHeading);
      this.cameraShakeIntensity = Math.max(this.cameraShakeIntensity, 0.15);
    }

    // Drift tire smoke & sparks
    if (this.vehicleController.isDrifting) {
      const rearL = pPos.clone().sub(carHeading.clone().multiplyScalar(1.2));
      this.particleSystem.emitDriftSparks(rearL);
    }

    this.particleSystem.update(
      delta,
      pPos,
      this.vehicleController.speedKmh,
      this.vehicleController.isBoosting
    );
  }

  private updateCamera(delta: number) {
    const carPos = this.vehicleController.position;
    const carHeading = this.vehicleController.rotationY + this.vehicleController.driftAngle * 0.2;

    const forward = new THREE.Vector3(Math.sin(carHeading), 0, Math.cos(carHeading));
    const targetCamPos = new THREE.Vector3();
    const targetLookAt = carPos.clone().add(new THREE.Vector3(0, 1.2, 0));

    if (this.cameraView === 'chase-close') {
      const offset = forward.clone().multiplyScalar(-7.2);
      offset.y = 2.8;
      targetCamPos.copy(carPos).add(offset);
    } else if (this.cameraView === 'chase-far') {
      const offset = forward.clone().multiplyScalar(-11.5);
      offset.y = 5.2;
      targetCamPos.copy(carPos).add(offset);
    } else if (this.cameraView === 'hood') {
      const offset = forward.clone().multiplyScalar(0.9);
      offset.y = 1.05;
      targetCamPos.copy(carPos).add(offset);
      targetLookAt.add(forward.clone().multiplyScalar(15));
    } else {
      // Top down
      targetCamPos.set(carPos.x, carPos.y + 24, carPos.z - 12);
    }

    // Camera Shake
    if (this.cameraShakeIntensity > 0) {
      const shakeX = (Math.random() - 0.5) * this.cameraShakeIntensity * 0.8;
      const shakeY = (Math.random() - 0.5) * this.cameraShakeIntensity * 0.8;
      targetCamPos.x += shakeX;
      targetCamPos.y += shakeY;
      this.cameraShakeIntensity = Math.max(0, this.cameraShakeIntensity - 2.5 * delta);
    }

    // Dynamic FOV kick on high speed & nitro
    const speedRatio = Math.min(1, Math.abs(this.vehicleController.speedKmh) / 320);
    const targetFov = 60 + speedRatio * 15 + (this.vehicleController.isBoosting ? 12 : 0);
    this.camera.fov = THREE.MathUtils.damp(this.camera.fov, targetFov, 6, delta);
    this.camera.updateProjectionMatrix();

    // Silky smooth camera damping
    this.camera.position.x = THREE.MathUtils.damp(this.camera.position.x, targetCamPos.x, 10, delta);
    this.camera.position.y = THREE.MathUtils.damp(this.camera.position.y, targetCamPos.y, 10, delta);
    this.camera.position.z = THREE.MathUtils.damp(this.camera.position.z, targetCamPos.z, 10, delta);

    this.camera.lookAt(targetLookAt);
  }

  private buildPlayerState(): PlayerState {
    return {
      speed: Math.round(this.vehicleController.speedKmh),
      rpm: Math.round(this.vehicleController.rpm),
      gear: this.vehicleController.gear,
      nitro: Math.round(this.vehicleController.nitro),
      isBoosting: this.vehicleController.isBoosting,
      isDrifting: this.vehicleController.isDrifting,
      driftScore: this.vehicleController.driftScore,
      driftMultiplier: this.vehicleController.driftMultiplier,
      driftAngle: this.vehicleController.driftAngle,
      coins: this.vehicleController.coinsCollected,
      distance: Math.round(this.vehicleController.totalDistance),
      maxSpeed: this.vehicleController.maxSpeedReached,
      lap: this.currentLap,
      totalLaps: this.totalLaps,
      lapTimes: this.lapTimes,
      currentLapTime: this.currentLapTime,
      bestLapTime: this.bestLapTime,
      position: this.calculatePosition(),
      totalRacers: (this.aiOpponents?.racers.length || 0) + 1,
      checkpointIndex: this.passedCheckpoints.size,
      health: Math.round(this.vehicleController.health),
      finished: this.raceFinished,
      crashed: this.vehicleController.health <= 0,
    };
  }

  public dispose() {
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
    }
    window.removeEventListener('resize', this.onResize);
    soundManager.pauseAudio();
    this.renderer.dispose();
    if (this.container && this.renderer.domElement) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
