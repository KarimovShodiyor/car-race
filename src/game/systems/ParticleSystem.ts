import * as THREE from 'three';

interface Particle {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  color: THREE.Color;
  size: number;
  life: number;
  maxLife: number;
}

export class ParticleSystem {
  public rootGroup: THREE.Group;
  private maxParticles: number = 600;
  private particles: Particle[] = [];

  // Points mesh
  private geometry: THREE.BufferGeometry;
  private positions: Float32Array;
  private colors: Float32Array;
  private sizes: Float32Array;
  private pointsMesh: THREE.Points;

  // Speed lines mesh
  private speedLinesMesh: THREE.LineSegments | null = null;
  private speedLinesActive: boolean = false;

  constructor() {
    this.rootGroup = new THREE.Group();

    this.positions = new Float32Array(this.maxParticles * 3);
    this.colors = new Float32Array(this.maxParticles * 3);
    this.sizes = new Float32Array(this.maxParticles);

    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    this.geometry.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));
    this.geometry.setAttribute('size', new THREE.BufferAttribute(this.sizes, 1));

    // Custom circular particle texture
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d')!;
    const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.3, 'rgba(6,182,212,0.9)');
    grad.addColorStop(1, 'rgba(6,182,212,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 32, 32);

    const texture = new THREE.CanvasTexture(canvas);

    const material = new THREE.PointsMaterial({
      size: 1.2,
      map: texture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      vertexColors: true,
    });

    this.pointsMesh = new THREE.Points(this.geometry, material);
    this.rootGroup.add(this.pointsMesh);

    this.setupSpeedLines();
  }

  private setupSpeedLines() {
    const lineCount = 80;
    const linePositions = new Float32Array(lineCount * 2 * 3);

    for (let i = 0; i < lineCount; i++) {
      const idx = i * 6;
      const x = (Math.random() - 0.5) * 20;
      const y = (Math.random() - 0.5) * 12 + 2;
      const z = (Math.random() - 0.5) * 35;

      linePositions[idx] = x;
      linePositions[idx + 1] = y;
      linePositions[idx + 2] = z;

      linePositions[idx + 3] = x;
      linePositions[idx + 4] = y;
      linePositions[idx + 5] = z - 6 - Math.random() * 8; // Length
    }

    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));

    const lineMat = new THREE.LineBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
    });

    this.speedLinesMesh = new THREE.LineSegments(lineGeo, lineMat);
    this.rootGroup.add(this.speedLinesMesh);
  }

  public emitNitro(rearPos: THREE.Vector3, carDirection: THREE.Vector3) {
    if (this.particles.length >= this.maxParticles) return;

    for (let i = 0; i < 4; i++) {
      const spread = (Math.random() - 0.5) * 0.4;
      const vel = carDirection
        .clone()
        .negate()
        .multiplyScalar(25 + Math.random() * 20)
        .add(new THREE.Vector3(spread, spread, spread));

      const isCyan = Math.random() > 0.3;
      const color = isCyan ? new THREE.Color(0x06b6d4) : new THREE.Color(0xec4899);

      this.particles.push({
        position: rearPos.clone().add(new THREE.Vector3((Math.random() - 0.5) * 0.8, 0, (Math.random() - 0.5) * 0.4)),
        velocity: vel,
        color,
        size: 1.8 + Math.random() * 1.5,
        life: 0,
        maxLife: 0.25 + Math.random() * 0.15,
      });
    }
  }

  public emitDriftSparks(wheelPos: THREE.Vector3) {
    if (this.particles.length >= this.maxParticles) return;

    for (let i = 0; i < 2; i++) {
      const vel = new THREE.Vector3((Math.random() - 0.5) * 6, Math.random() * 4 + 1, (Math.random() - 0.5) * 6);

      this.particles.push({
        position: wheelPos.clone().add(new THREE.Vector3((Math.random() - 0.5) * 0.2, 0.1, 0)),
        velocity: vel,
        color: new THREE.Color(0xf59e0b), // Golden sparks
        size: 0.8 + Math.random() * 0.6,
        life: 0,
        maxLife: 0.3 + Math.random() * 0.2,
      });
    }
  }

  public emitCollision(pos: THREE.Vector3) {
    for (let i = 0; i < 35; i++) {
      if (this.particles.length >= this.maxParticles) break;

      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * 18,
        Math.random() * 12 + 2,
        (Math.random() - 0.5) * 18
      );

      this.particles.push({
        position: pos.clone(),
        velocity: vel,
        color: Math.random() > 0.5 ? new THREE.Color(0xf59e0b) : new THREE.Color(0x06b6d4),
        size: 1.4 + Math.random() * 1.2,
        life: 0,
        maxLife: 0.4 + Math.random() * 0.3,
      });
    }
  }

  public update(delta: number, carPos: THREE.Vector3, speedKmh: number, isBoosting: boolean) {
    // 1. Update active particles
    let writeIdx = 0;
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      p.life += delta;

      if (p.life < p.maxLife) {
        // Move particle
        p.position.addScaledVector(p.velocity, delta);

        const progress = p.life / p.maxLife;
        const fade = 1 - progress;

        this.positions[writeIdx * 3] = p.position.x;
        this.positions[writeIdx * 3 + 1] = p.position.y;
        this.positions[writeIdx * 3 + 2] = p.position.z;

        this.colors[writeIdx * 3] = p.color.r * fade;
        this.colors[writeIdx * 3 + 1] = p.color.g * fade;
        this.colors[writeIdx * 3 + 2] = p.color.b * fade;

        this.sizes[writeIdx] = p.size * fade;

        this.particles[writeIdx] = p;
        writeIdx++;
      }
    }
    this.particles.length = writeIdx;

    // Zero out unused buffer
    for (let i = writeIdx; i < this.maxParticles; i++) {
      this.sizes[i] = 0;
    }

    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.attributes.color.needsUpdate = true;
    this.geometry.attributes.size.needsUpdate = true;

    // 2. Speed lines follow camera/car
    if (this.speedLinesMesh) {
      this.speedLinesMesh.position.copy(carPos);
      const isHighSpeed = speedKmh > 210 || isBoosting;
      const targetOpacity = isBoosting ? 0.75 : isHighSpeed ? 0.35 : 0;
      const mat = this.speedLinesMesh.material as THREE.LineBasicMaterial;
      mat.opacity = THREE.MathUtils.damp(mat.opacity, targetOpacity, 8, delta);
    }
  }
}
