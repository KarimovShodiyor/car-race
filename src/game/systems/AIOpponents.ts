import * as THREE from 'three';
import { Difficulty, AIRacer } from '../../types/game';
import { createCyberCar, CarVisualGroup } from '../geometry/CarModels';

export class AIOpponents {
  public racers: AIRacer[] = [];
  public carMeshes: CarVisualGroup[] = [];
  public rootGroup: THREE.Group;
  public trackSpline: THREE.CatmullRomCurve3 | null = null;
  public difficulty: Difficulty;

  private names = ['Zero-X', 'AeroViper', 'NeonGhost', 'Kurogane', 'Chronos', 'ApexOne', 'Valkyrie'];
  private colors = ['#ef4444', '#a855f7', '#10b981', '#f59e0b', '#ec4899', '#3b82f6', '#e2e8f0'];

  constructor(difficulty: Difficulty = 'normal', count: number = 5) {
    this.rootGroup = new THREE.Group();
    this.difficulty = difficulty;
    this.initRacers(count);
  }

  public setTrackSpline(spline: THREE.CatmullRomCurve3) {
    this.trackSpline = spline;
    this.resetPositions();
  }

  private initRacers(count: number) {
    // Difficulty speed modifier
    const diffSpeedMult = this.difficulty === 'easy' ? 0.78 : this.difficulty === 'normal' ? 0.92 : 1.02;

    for (let i = 0; i < count; i++) {
      const name = this.names[i % this.names.length];
      const color = this.colors[i % this.colors.length];
      const carMesh = createCyberCar('cyber-gt', color, '#06b6d4', '#cbd5e1');

      this.rootGroup.add(carMesh);
      this.carMeshes.push(carMesh);

      // Base target speed in km/h
      const targetSpeed = (230 + Math.random() * 50) * diffSpeedMult;

      this.racers.push({
        id: `ai-${i}`,
        name,
        carModel: 'cyber-gt',
        color,
        progress: 0,
        speed: 0,
        targetSpeed,
        lane: (i % 3) - 1, // -1, 0, 1
        x: 0,
        z: 0,
        rotationY: 0,
        meshGroup: carMesh,
      });
    }
  }

  public resetPositions() {
    if (!this.trackSpline) return;

    const up = new THREE.Vector3(0, 1, 0);

    for (let i = 0; i < this.racers.length; i++) {
      const racer = this.racers[i];
      const mesh = this.carMeshes[i];

      // Stagger initial grid starting positions behind start line
      const initialProgress = 0.98 - i * 0.015;
      racer.progress = (initialProgress + 1) % 1;
      racer.speed = 0;

      const pt = this.trackSpline.getPointAt(racer.progress);
      const tangent = this.trackSpline.getTangentAt(racer.progress).normalize();
      const normal = new THREE.Vector3().crossVectors(tangent, up).normalize();

      const laneOffset = racer.lane * 3.5;
      const pos = pt.clone().add(normal.clone().multiplyScalar(laneOffset));

      racer.x = pos.x;
      racer.z = pos.z;

      mesh.position.set(pos.x, 0, pos.z);
      mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), tangent);
    }
  }

  public update(delta: number) {
    if (!this.trackSpline) return;

    const trackLength = this.trackSpline.getLength();
    const up = new THREE.Vector3(0, 1, 0);

    for (let i = 0; i < this.racers.length; i++) {
      const racer = this.racers[i];
      const mesh = this.carMeshes[i];

      // Accelerate towards target speed
      racer.speed = THREE.MathUtils.damp(racer.speed, racer.targetSpeed, 3, delta);

      // Forward advancement
      const speedMps = (racer.speed * 1000) / 3600;
      const progressDelta = (speedMps * delta) / trackLength;
      racer.progress = (racer.progress + progressDelta) % 1.0;

      // Sample track point
      const pt = this.trackSpline.getPointAt(racer.progress);
      const tangent = this.trackSpline.getTangentAt(racer.progress).normalize();
      const normal = new THREE.Vector3().crossVectors(tangent, up).normalize();

      const laneOffset = racer.lane * 3.2;
      const targetPos = pt.clone().add(normal.clone().multiplyScalar(laneOffset));

      racer.x = targetPos.x;
      racer.z = targetPos.z;

      mesh.position.set(targetPos.x, 0, targetPos.z);
      mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), tangent);

      // Spin wheels
      const wheelSpin = (speedMps / 0.36) * delta;
      for (const w of mesh.wheels) {
        w.rotation.x += wheelSpin;
      }
    }
  }
}
