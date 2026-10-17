import * as THREE from 'three';
import { GameMode, EnergyCoin, TrafficVehicle } from '../../types/game';
import { createCyberCar } from './CarModels';

export interface Waypoint {
  x: number;
  y: number;
  z: number;
  direction: THREE.Vector3;
  width: number;
}

export class TrackManager {
  public rootGroup: THREE.Group;
  public mode: GameMode;
  public waypoints: Waypoint[] = [];
  public trackSpline: THREE.CatmullRomCurve3 | null = null;
  public trackLength: number = 0;

  // Circuit elements
  public finishGateMesh: THREE.Group | null = null;
  public checkpointMeshes: THREE.Group[] = [];

  // Endless Highway elements
  public highwayChunks: THREE.Group[] = [];
  public chunkSize: number = 200;
  public activeChunksCount: number = 8;
  public coins: EnergyCoin[] = [];
  public coinMeshes: THREE.Mesh[] = [];
  public traffic: TrafficVehicle[] = [];
  public trafficMeshes: THREE.Group[] = [];

  constructor(mode: GameMode) {
    this.rootGroup = new THREE.Group();
    this.mode = mode;

    if (this.mode === 'endless') {
      this.buildEndlessHighway();
    } else {
      this.buildCircuitTrack();
    }
  }

  /**
   * Builds closed-loop high-speed Grand Prix Cyber Circuit
   */
  private buildCircuitTrack() {
    // Key points defining the cyberpunk circuit
    const circuitPoints = [
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, 300),
      new THREE.Vector3(60, 0, 500),
      new THREE.Vector3(180, 0, 620),
      new THREE.Vector3(320, 0, 520),
      new THREE.Vector3(360, 0, 320),
      new THREE.Vector3(260, 0, 120),
      new THREE.Vector3(340, 0, -80),
      new THREE.Vector3(380, 0, -320),
      new THREE.Vector3(250, 0, -520),
      new THREE.Vector3(60, 0, -540),
      new THREE.Vector3(-120, 0, -400),
      new THREE.Vector3(-140, 0, -180),
      new THREE.Vector3(-40, 0, -60),
    ];

    this.trackSpline = new THREE.CatmullRomCurve3(circuitPoints, true, 'centripetal');
    this.trackLength = this.trackSpline.getLength();

    // Sample waypoints
    const sampleCount = 200;
    for (let i = 0; i <= sampleCount; i++) {
      const u = i / sampleCount;
      const pt = this.trackSpline.getPointAt(u);
      const tangent = this.trackSpline.getTangentAt(u).normalize();
      this.waypoints.push({
        x: pt.x,
        y: pt.y,
        z: pt.z,
        direction: tangent,
        width: 22,
      });
    }

    // Generate road surface mesh along spline
    const trackWidth = 24;
    const segments = 250;
    const roadGeo = new THREE.BufferGeometry();
    const positions: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];

    const up = new THREE.Vector3(0, 1, 0);

    for (let i = 0; i <= segments; i++) {
      const u = i / segments;
      const pt = this.trackSpline.getPointAt(u);
      const tangent = this.trackSpline.getTangentAt(u).normalize();
      const normal = new THREE.Vector3().crossVectors(tangent, up).normalize();

      const left = pt.clone().add(normal.clone().multiplyScalar(trackWidth / 2));
      const right = pt.clone().sub(normal.clone().multiplyScalar(trackWidth / 2));

      positions.push(left.x, left.y + 0.05, left.z);
      positions.push(right.x, right.y + 0.05, right.z);

      uvs.push(0, u * 50);
      uvs.push(1, u * 50);

      if (i < segments) {
        const row1 = i * 2;
        const row2 = (i + 1) * 2;
        indices.push(row1, row1 + 1, row2);
        indices.push(row1 + 1, row2 + 1, row2);
      }
    }

    roadGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    roadGeo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    roadGeo.setIndex(indices);
    roadGeo.computeVertexNormals();

    // Road material (Dark asphalt with neon reflective sheen)
    const roadMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.35,
      metalness: 0.6,
    });
    const roadMesh = new THREE.Mesh(roadGeo, roadMat);
    roadMesh.receiveShadow = true;
    this.rootGroup.add(roadMesh);

    // Glowing Neon Edge Curbs along track
    this.buildTrackCurbs(segments, trackWidth);

    // Checkpoint & Finish Gantries
    this.buildGantries();
  }

  private buildTrackCurbs(segments: number, trackWidth: number) {
    if (!this.trackSpline) return;

    const leftCurbs: THREE.Vector3[] = [];
    const rightCurbs: THREE.Vector3[] = [];
    const up = new THREE.Vector3(0, 1, 0);

    for (let i = 0; i <= segments; i++) {
      const u = i / segments;
      const pt = this.trackSpline.getPointAt(u);
      const tangent = this.trackSpline.getTangentAt(u).normalize();
      const normal = new THREE.Vector3().crossVectors(tangent, up).normalize();

      leftCurbs.push(pt.clone().add(normal.clone().multiplyScalar(trackWidth / 2 + 0.3)));
      rightCurbs.push(pt.clone().sub(normal.clone().multiplyScalar(trackWidth / 2 + 0.3)));
    }

    const leftCurbGeo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(leftCurbs, true), segments, 0.25, 6, true);
    const rightCurbGeo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(rightCurbs, true), segments, 0.25, 6, true);

    const curbMatL = new THREE.MeshBasicMaterial({ color: 0x06b6d4 }); // Cyan neon
    const curbMatR = new THREE.MeshBasicMaterial({ color: 0xec4899 }); // Magenta neon

    const leftMesh = new THREE.Mesh(leftCurbGeo, curbMatL);
    const rightMesh = new THREE.Mesh(rightCurbGeo, curbMatR);
    leftMesh.position.y = 0.2;
    rightMesh.position.y = 0.2;

    this.rootGroup.add(leftMesh);
    this.rootGroup.add(rightMesh);
  }

  private buildGantries() {
    if (!this.trackSpline) return;

    // Checkpoints at 25%, 50%, 75%
    const checkpointRatios = [0.25, 0.5, 0.75];
    checkpointRatios.forEach((ratio, index) => {
      const gantry = this.createArchway(`CHECKPOINT 0${index + 1}`, 0x06b6d4);
      const pt = this.trackSpline!.getPointAt(ratio);
      const tangent = this.trackSpline!.getTangentAt(ratio).normalize();
      gantry.position.copy(pt);
      gantry.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), tangent);
      this.rootGroup.add(gantry);
      this.checkpointMeshes.push(gantry);
    });

    // Start / Finish Line Gantry at 0.0
    const startGantry = this.createArchway('START / FINISH', 0xf59e0b, true);
    const startPt = this.trackSpline.getPointAt(0);
    const startTangent = this.trackSpline.getTangentAt(0).normalize();
    startGantry.position.copy(startPt);
    startGantry.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), startTangent);
    this.rootGroup.add(startGantry);
    this.finishGateMesh = startGantry;
  }

  private createArchway(title: string, colorHex: number, isFinish: boolean = false): THREE.Group {
    const arch = new THREE.Group();

    // Arch pillar geometry
    const pillarMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.9,
      roughness: 0.2,
    });
    const neonMat = new THREE.MeshBasicMaterial({ color: colorHex });

    // Left and right pillars
    const pillarGeo = new THREE.BoxGeometry(1.2, 11, 1.2);
    const leftPillar = new THREE.Mesh(pillarGeo, pillarMat);
    leftPillar.position.set(-13, 5.5, 0);
    const rightPillar = new THREE.Mesh(pillarGeo, pillarMat);
    rightPillar.position.set(13, 5.5, 0);
    arch.add(leftPillar);
    arch.add(rightPillar);

    // Cross beam
    const beamGeo = new THREE.BoxGeometry(27.2, 1.8, 1.6);
    const crossBeam = new THREE.Mesh(beamGeo, pillarMat);
    crossBeam.position.set(0, 10.5, 0);
    arch.add(crossBeam);

    // Holographic Banner Canvas
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = 'rgba(10, 15, 30, 0.9)';
    ctx.fillRect(0, 0, 512, 128);
    ctx.strokeStyle = `#${colorHex.toString(16).padStart(6, '0')}`;
    ctx.lineWidth = 6;
    ctx.strokeRect(6, 6, 500, 116);
    ctx.font = 'bold 36px monospace';
    ctx.fillStyle = `#${colorHex.toString(16).padStart(6, '0')}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(title, 256, 64);

    const bannerTex = new THREE.CanvasTexture(canvas);
    bannerTex.colorSpace = THREE.SRGBColorSpace;
    const bannerMat = new THREE.MeshBasicMaterial({
      map: bannerTex,
      transparent: true,
      side: THREE.DoubleSide,
    });
    const banner = new THREE.Mesh(new THREE.PlaneGeometry(16, 4), bannerMat);
    banner.position.set(0, 8.5, 0);
    arch.add(banner);

    // Glowing top neon tubes
    const tubeGeo = new THREE.BoxGeometry(27, 0.25, 0.25);
    const tube = new THREE.Mesh(tubeGeo, neonMat);
    tube.position.set(0, 11.5, 0);
    arch.add(tube);

    return arch;
  }

  /**
   * Endless 4-lane Cyber Highway System
   */
  private buildEndlessHighway() {
    for (let i = 0; i < this.activeChunksCount; i++) {
      const zOffset = i * this.chunkSize;
      const chunk = this.createHighwayChunk(zOffset);
      this.highwayChunks.push(chunk);
      this.rootGroup.add(chunk);
    }

    // Spawn initial energy coins
    this.spawnCoins();

    // Spawn initial cyber traffic
    this.spawnInitialTraffic();
  }

  private createHighwayChunk(zPos: number): THREE.Group {
    const chunk = new THREE.Group();
    chunk.position.z = zPos;

    const roadWidth = 26; // 4 lanes, approx 6.5m per lane
    const roadLength = this.chunkSize;

    // Road asphalt plane
    const roadGeo = new THREE.PlaneGeometry(roadWidth, roadLength);
    roadGeo.rotateX(-Math.PI / 2);
    const roadMat = new THREE.MeshStandardMaterial({
      color: 0x090d16,
      roughness: 0.35,
      metalness: 0.7,
    });
    const road = new THREE.Mesh(roadGeo, roadMat);
    road.position.set(0, 0, roadLength / 2);
    road.receiveShadow = true;
    chunk.add(road);

    // Glowing Lane Dividers
    const laneX = [-6.5, 0, 6.5];
    laneX.forEach((x) => {
      const lineGeo = new THREE.PlaneGeometry(0.35, roadLength);
      lineGeo.rotateX(-Math.PI / 2);
      const lineMat = new THREE.MeshBasicMaterial({
        color: 0x06b6d4,
        transparent: true,
        opacity: 0.8,
      });
      const line = new THREE.Mesh(lineGeo, lineMat);
      line.position.set(x, 0.04, roadLength / 2);
      chunk.add(line);
    });

    // Neon Highway Edge Barriers
    const barrierMatL = new THREE.MeshBasicMaterial({ color: 0x06b6d4 });
    const barrierMatR = new THREE.MeshBasicMaterial({ color: 0xec4899 });
    const barrierGeo = new THREE.BoxGeometry(0.5, 1.2, roadLength);

    const leftBarrier = new THREE.Mesh(barrierGeo, barrierMatL);
    leftBarrier.position.set(-roadWidth / 2 - 0.25, 0.6, roadLength / 2);
    chunk.add(leftBarrier);

    const rightBarrier = new THREE.Mesh(barrierGeo, barrierMatR);
    rightBarrier.position.set(roadWidth / 2 + 0.25, 0.6, roadLength / 2);
    chunk.add(rightBarrier);

    // Overhead neon arch every chunk
    const arch = this.createArchway('CYBERWAY 2099', 0x38bdf8);
    arch.position.set(0, 0, roadLength / 2);
    chunk.add(arch);

    return chunk;
  }

  private spawnCoins() {
    const coinGeo = new THREE.OctahedronGeometry(0.7, 0);
    const coinMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      emissive: 0xf59e0b,
      emissiveIntensity: 0.6,
      metalness: 0.9,
      roughness: 0.1,
    });

    // Spawn 40 coins scattered across highway lanes
    const lanePositions = [-9.5, -3.2, 3.2, 9.5];
    for (let i = 0; i < 40; i++) {
      const lane = lanePositions[Math.floor(Math.random() * lanePositions.length)];
      const z = 80 + i * 35;
      const coinMesh = new THREE.Mesh(coinGeo, coinMat);
      coinMesh.position.set(lane, 1.2, z);
      this.rootGroup.add(coinMesh);
      this.coinMeshes.push(coinMesh);

      this.coins.push({
        id: i,
        x: lane,
        y: 1.2,
        z: z,
        collected: false,
        rotation: Math.random() * Math.PI,
      });
    }
  }

  private spawnInitialTraffic() {
    const lanePositions = [-9.5, -3.2, 3.2, 9.5];
    const colors = ['#ec4899', '#3b82f6', '#8b5cf6', '#10b981', '#f59e0b'];

    for (let i = 0; i < 10; i++) {
      const laneIdx = Math.floor(Math.random() * lanePositions.length);
      const laneX = lanePositions[laneIdx];
      const z = 120 + i * 110 + Math.random() * 40;
      const color = colors[i % colors.length];

      const car = createCyberCar('cyber-gt', color, '#06b6d4', '#e2e8f0');
      car.position.set(laneX, 0, z);
      this.rootGroup.add(car);
      this.trafficMeshes.push(car);

      this.traffic.push({
        id: i,
        lane: laneIdx,
        speed: 130 + Math.random() * 40, // Traffic travels at ~130-170 km/h
        x: laneX,
        z: z,
        color,
        modelType: 0,
      });
    }
  }

  public updateEndless(playerZ: number, delta: number) {
    if (this.mode !== 'endless') return;

    // Highway chunk recycling
    for (let i = 0; i < this.highwayChunks.length; i++) {
      const chunk = this.highwayChunks[i];
      if (chunk.position.z + this.chunkSize < playerZ - 50) {
        // Move ahead
        const furthestZ = Math.max(...this.highwayChunks.map((c) => c.position.z));
        chunk.position.z = furthestZ + this.chunkSize;
      }
    }

    // Animate and recycle coins
    const lanePositions = [-9.5, -3.2, 3.2, 9.5];
    for (let i = 0; i < this.coins.length; i++) {
      const coin = this.coins[i];
      const mesh = this.coinMeshes[i];

      if (!coin.collected) {
        coin.rotation += delta * 3;
        mesh.rotation.y = coin.rotation;
        mesh.position.y = 1.2 + Math.sin(coin.rotation * 2) * 0.2;
      }

      // Recycle coin if far behind
      if (coin.z < playerZ - 30) {
        coin.z = playerZ + 400 + Math.random() * 200;
        coin.x = lanePositions[Math.floor(Math.random() * lanePositions.length)];
        coin.collected = false;
        mesh.visible = true;
        mesh.position.set(coin.x, coin.y, coin.z);
      }
    }

    // Update traffic positions
    for (let i = 0; i < this.traffic.length; i++) {
      const t = this.traffic[i];
      const mesh = this.trafficMeshes[i];

      // Convert km/h to m/s
      const mps = (t.speed * 1000) / 3600;
      t.z += mps * delta;

      // Recycle if behind player
      if (t.z < playerZ - 40) {
        t.z = playerZ + 350 + Math.random() * 150;
        t.lane = Math.floor(Math.random() * lanePositions.length);
        t.x = lanePositions[t.lane];
        t.speed = 130 + Math.random() * 40;
      }

      mesh.position.set(t.x, 0, t.z);
    }
  }
}
