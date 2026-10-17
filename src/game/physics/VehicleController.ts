import * as THREE from 'three';
import { CarSpecs, PlayerState } from '../../types/game';
import { CarVisualGroup } from '../geometry/CarModels';
import { soundManager } from '../../audio/SoundManager';

export interface VehicleInputs {
  throttle: boolean;
  brake: boolean;
  steerLeft: boolean;
  steerRight: boolean;
  handbrake: boolean;
  nitro: boolean;
}

export class VehicleController {
  public specs: CarSpecs;
  public visualGroup: CarVisualGroup;

  // Position, velocity, orientation
  public position: THREE.Vector3 = new THREE.Vector3(0, 0, 0);
  public velocity: THREE.Vector3 = new THREE.Vector3(0, 0, 0);
  public rotationY: number = 0; // Heading in radians
  public steerAngle: number = 0; // Current front wheel angle

  // Physics state
  public speedKmh: number = 0;
  public rpm: number = 1000;
  public gear: number = 1;
  public nitro: number = 100;
  public isBoosting: boolean = false;
  public isDrifting: boolean = false;
  public driftAngle: number = 0;
  public driftScore: number = 0;
  public driftMultiplier: number = 1;
  private driftTimer: number = 0;

  // Visual suspension & pitch/roll offsets
  public pitch: number = 0;
  public roll: number = 0;
  private wheelRotation: number = 0;

  // Stats tracking
  public maxSpeedReached: number = 0;
  public totalDistance: number = 0;
  public coinsCollected: number = 0;
  public health: number = 100;

  constructor(specs: CarSpecs, visualGroup: CarVisualGroup) {
    this.specs = specs;
    this.visualGroup = visualGroup;
    this.nitro = specs.nitroCapacity;
  }

  public setPosition(x: number, y: number, z: number, headingRad: number = 0) {
    this.position.set(x, y, z);
    this.rotationY = headingRad;
    this.velocity.set(0, 0, 0);
    this.speedKmh = 0;
    this.rpm = 1000;
    this.visualGroup.position.copy(this.position);
    this.visualGroup.rotation.y = this.rotationY;
  }

  public update(inputs: VehicleInputs, delta: number, sensitivity: number = 1.0) {
    const dt = Math.min(delta, 0.1); // Clamp delta to avoid tunneling

    // 1. NITRO BOOST HANDLING
    if (inputs.nitro && this.nitro > 0 && (inputs.throttle || this.speedKmh > 30)) {
      this.isBoosting = true;
      this.nitro = Math.max(0, this.nitro - 28 * dt);
      soundManager.updateNitroSound(true);
    } else {
      this.isBoosting = false;
      soundManager.updateNitroSound(false);
      // Slowly regenerate nitro when driving
      if (this.speedKmh > 50 && this.nitro < this.specs.nitroCapacity) {
        this.nitro = Math.min(this.specs.nitroCapacity, this.nitro + 6 * dt);
      }
    }

    // 2. ACCELERATION & TOP SPEED
    let effectiveTopSpeed = this.specs.topSpeed;
    if (this.isBoosting) {
      effectiveTopSpeed += 55; // Nitro supercharge
    }

    const accelPower = (this.specs.acceleration / 100) * 14.5 * (this.isBoosting ? 1.75 : 1.0);
    const brakePower = 22.0;
    const dragCoeff = 0.08;
    const rollingResistance = 1.2;

    // Convert current forward speed (m/s)
    let forwardSpeed = (this.speedKmh * 1000) / 3600;

    if (inputs.throttle) {
      if (forwardSpeed < (effectiveTopSpeed * 1000) / 3600) {
        // Higher gears have slightly tapering acceleration curves
        const gearAccelRatio = Math.max(0.4, 1.0 - (this.gear - 1) * 0.1);
        forwardSpeed += accelPower * gearAccelRatio * dt;
      }
    } else if (inputs.brake) {
      if (forwardSpeed > 1) {
        forwardSpeed -= brakePower * dt;
      } else {
        // Reverse gear
        forwardSpeed -= 8.0 * dt;
        if (forwardSpeed < -12) forwardSpeed = -12; // Reverse max ~43 km/h
      }
    } else {
      // Coasting deceleration
      if (forwardSpeed > 0) {
        forwardSpeed = Math.max(0, forwardSpeed - (rollingResistance + forwardSpeed * dragCoeff) * dt);
      } else if (forwardSpeed < 0) {
        forwardSpeed = Math.min(0, forwardSpeed + (rollingResistance + Math.abs(forwardSpeed) * dragCoeff) * dt);
      }
    }

    // Handbrake deceleration
    if (inputs.handbrake && forwardSpeed > 0) {
      forwardSpeed = Math.max(0, forwardSpeed - 9.0 * dt);
    }

    this.speedKmh = (forwardSpeed * 3600) / 1000;
    if (Math.abs(this.speedKmh) > this.maxSpeedReached) {
      this.maxSpeedReached = Math.round(Math.abs(this.speedKmh));
    }
    this.totalDistance += Math.abs(forwardSpeed) * dt;

    // 3. GEAR & RPM SIMULATION
    this.calculateGearAndRpm(inputs.throttle);

    // 4. STEERING & DRIFTING
    let targetSteer = 0;
    if (inputs.steerLeft) targetSteer += 1;
    if (inputs.steerRight) targetSteer -= 1;
    targetSteer *= sensitivity;

    // High speed dampening for steering
    const speedSteerDamp = Math.max(0.35, 1.0 - (Math.abs(this.speedKmh) / 350) * 0.65);
    const maxSteerRad = 0.55 * speedSteerDamp;

    this.steerAngle = THREE.MathUtils.damp(this.steerAngle, targetSteer * maxSteerRad, 12, dt);

    // Drift Detection
    const isTryingToDrift = inputs.handbrake || (Math.abs(targetSteer) > 0.6 && this.speedKmh > 90);
    if (isTryingToDrift && Math.abs(this.speedKmh) > 45) {
      this.isDrifting = true;
      const driftDir = Math.sign(this.steerAngle) || 1;
      this.driftAngle = THREE.MathUtils.damp(this.driftAngle, driftDir * 0.45 * this.specs.driftFactor, 8, dt);
      this.driftTimer += dt;
      this.driftScore += Math.round(Math.abs(this.speedKmh) * 0.6 * this.driftMultiplier * dt);

      if (this.driftTimer > 1.2) {
        this.driftMultiplier = Math.min(5, 1 + Math.floor(this.driftTimer * 0.8));
      }

      // Refill nitro during sick drifts!
      this.nitro = Math.min(this.specs.nitroCapacity, this.nitro + 12 * dt);
      soundManager.updateTireScreech(true, Math.abs(this.steerAngle) * 1.5);
    } else {
      this.isDrifting = false;
      this.driftAngle = THREE.MathUtils.damp(this.driftAngle, 0, 10, dt);
      this.driftTimer = 0;
      this.driftMultiplier = 1;
      soundManager.updateTireScreech(false, 0);
    }

    // Apply rotation
    if (Math.abs(forwardSpeed) > 0.2) {
      const turnRate = (this.specs.handling / 100) * 2.8;
      const turnDir = forwardSpeed >= 0 ? 1 : -1;
      this.rotationY += this.steerAngle * turnRate * turnDir * dt;
    }

    // 5. UPDATE POSITION WITH DRIFT SLIP
    const effectiveAngle = this.rotationY + this.driftAngle;
    const forwardVec = new THREE.Vector3(Math.sin(effectiveAngle), 0, Math.cos(effectiveAngle));
    this.velocity.copy(forwardVec.multiplyScalar(forwardSpeed));
    this.position.addScaledVector(this.velocity, dt);

    // 6. SUSPENSION PITCH & ROLL
    const targetPitch = inputs.brake ? 0.04 : inputs.throttle || this.isBoosting ? -0.035 : 0;
    this.pitch = THREE.MathUtils.damp(this.pitch, targetPitch, 8, dt);

    const targetRoll = -this.steerAngle * 0.12;
    this.roll = THREE.MathUtils.damp(this.roll, targetRoll, 10, dt);

    // 7. SYNC 3D MESH
    this.visualGroup.position.copy(this.position);
    this.visualGroup.rotation.y = this.rotationY + this.driftAngle * 0.3;
    this.visualGroup.rotation.x = this.pitch;
    this.visualGroup.rotation.z = this.roll;

    // Wheel spin
    this.wheelRotation += (forwardSpeed / 0.36) * dt;
    for (const w of this.visualGroup.wheels) {
      w.rotation.x = this.wheelRotation;
    }

    // Front wheels steering turn
    this.visualGroup.frontLeftWheel.rotation.y = this.steerAngle;
    this.visualGroup.frontRightWheel.rotation.y = this.steerAngle;

    // Nitro Thruster Glow Intensity
    const glowScale = this.isBoosting ? 2.2 : inputs.throttle ? 1.0 : 0.4;
    for (const glow of this.visualGroup.thrusterGlows) {
      glow.scale.set(glowScale, glowScale, glowScale);
    }

    // Update sound engine
    soundManager.updateEngine(this.rpm, Math.abs(this.speedKmh), inputs.throttle || this.isBoosting);
  }

  private calculateGearAndRpm(isThrottle: boolean) {
    const spd = Math.abs(this.speedKmh);
    if (this.speedKmh < -1) {
      this.gear = -1; // Reverse
      this.rpm = 1500 + (spd / 40) * 4500;
      return;
    }

    const gearThresholds = [0, 50, 100, 160, 225, 290, 360];
    let g = 1;
    for (let i = 1; i < gearThresholds.length; i++) {
      if (spd >= gearThresholds[i - 1]) {
        g = i;
      }
    }
    this.gear = g;

    const lower = gearThresholds[g - 1];
    const upper = gearThresholds[g] || 400;
    const progress = Math.min(1, Math.max(0, (spd - lower) / (upper - lower)));

    if (isThrottle) {
      this.rpm = 2500 + progress * 6200;
    } else {
      this.rpm = 1200 + progress * 3000;
    }
  }

  public triggerCollision(reboundForce: number = 8) {
    soundManager.playCollisionSound(0.7);
    this.speedKmh *= 0.45;
    this.health = Math.max(0, this.health - 6);
  }
}
