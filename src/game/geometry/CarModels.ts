import * as THREE from 'three';

export interface CarVisualGroup extends THREE.Group {
  wheels: THREE.Group[];
  frontLeftWheel: THREE.Group;
  frontRightWheel: THREE.Group;
  rearLeftWheel: THREE.Group;
  rearRightWheel: THREE.Group;
  thrusterGlows: THREE.Mesh[];
  headlights: THREE.Mesh[];
  taillights: THREE.Mesh[];
  underglow: THREE.Mesh;
  bodyMesh: THREE.Mesh;
  spoilerMesh?: THREE.Mesh;
}

/**
 * Creates a wheel group consisting of:
 * - Tire (dark rubber)
 * - Wheel Rim (metallic alloy)
 * - Hubcap / Cyber rim spokes
 * - Brake disc & neon caliper
 */
function createWheel(width: number, radius: number, rimColor: string, isFront: boolean = false): THREE.Group {
  const wheelGroup = new THREE.Group();

  // Rubber tire
  const tireGeo = new THREE.CylinderGeometry(radius, radius, width, 24);
  tireGeo.rotateZ(Math.PI / 2);
  const tireMat = new THREE.MeshStandardMaterial({
    color: 0x111317,
    roughness: 0.85,
    metalness: 0.1,
  });
  const tire = new THREE.Mesh(tireGeo, tireMat);
  tire.castShadow = true;
  wheelGroup.add(tire);

  // Rim outer ring
  const rimGeo = new THREE.CylinderGeometry(radius * 0.72, radius * 0.72, width * 1.02, 16);
  rimGeo.rotateZ(Math.PI / 2);
  const rimMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(rimColor),
    roughness: 0.2,
    metalness: 0.9,
  });
  const rim = new THREE.Mesh(rimGeo, rimMat);
  wheelGroup.add(rim);

  // Cyber Rim Spokes
  const spokeGeo = new THREE.BoxGeometry(width * 1.04, radius * 1.35, radius * 0.15);
  for (let i = 0; i < 3; i++) {
    const spoke = new THREE.Mesh(spokeGeo, rimMat);
    spoke.rotation.x = (i * Math.PI) / 3;
    wheelGroup.add(spoke);
  }

  // Brake Caliper (Neon glow accent)
  const caliperGeo = new THREE.BoxGeometry(width * 0.9, radius * 0.45, radius * 0.22);
  const caliperMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4 });
  const caliper = new THREE.Mesh(caliperGeo, caliperMat);
  caliper.position.set(0, radius * 0.35, 0);
  wheelGroup.add(caliper);

  return wheelGroup;
}

/**
 * Procedural Cyber Car Builder
 */
export function createCyberCar(
  style: 'cyber-gt' | 'vortex-xr' | 'phantom-x' | 'titan-apex' = 'cyber-gt',
  bodyColorHex: string = '#06b6d4',
  neonColorHex: string = '#22d3ee',
  rimColorHex: string = '#e2e8f0'
): CarVisualGroup {
  const root = new THREE.Group() as CarVisualGroup;

  const bodyMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(bodyColorHex),
    metalness: 0.88,
    roughness: 0.22,
  });

  const darkTrimMat = new THREE.MeshStandardMaterial({
    color: 0x090d16,
    metalness: 0.6,
    roughness: 0.4,
  });

  const canopyMat = new THREE.MeshPhysicalMaterial({
    color: 0x020617,
    transmission: 0.6,
    opacity: 0.9,
    transparent: true,
    roughness: 0.05,
    metalness: 0.2,
    ior: 1.6,
  });

  const neonMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color(neonColorHex),
  });

  const headlightMat = new THREE.MeshBasicMaterial({
    color: 0xe0f2fe,
  });

  const taillightMat = new THREE.MeshBasicMaterial({
    color: 0xef4444,
  });

  const thrusters: THREE.Mesh[] = [];
  const headlights: THREE.Mesh[] = [];
  const taillights: THREE.Mesh[] = [];

  // Wheel dimensions
  const wheelRadius = style === 'titan-apex' ? 0.42 : 0.36;
  const wheelWidth = style === 'phantom-x' ? 0.34 : 0.28;
  const wheelBaseX = style === 'phantom-x' ? 1.08 : 0.98;
  const wheelBaseZ = style === 'titan-apex' ? 1.45 : 1.35;

  // 1. PRIMARY SILHOUETTE: Main Body Hull
  let bodyGeo: THREE.BufferGeometry;
  if (style === 'cyber-gt') {
    // Aerodynamic wedge chiseled shape
    const shape = new THREE.Shape();
    shape.moveTo(-1.0, -0.2);
    shape.lineTo(1.0, -0.2);
    shape.lineTo(0.9, 0.25);
    shape.lineTo(0.6, 0.45);
    shape.lineTo(-0.6, 0.45);
    shape.lineTo(-0.95, 0.15);
    shape.closePath();

    const extrudeSettings = {
      steps: 2,
      depth: 4.2,
      bevelEnabled: true,
      bevelThickness: 0.15,
      bevelSize: 0.1,
      bevelSegments: 3,
    };
    bodyGeo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    bodyGeo.center();
    bodyGeo.rotateY(Math.PI / 2);
  } else if (style === 'vortex-xr') {
    // Hyper streamlined aerodynamic shape
    bodyGeo = new THREE.BoxGeometry(1.95, 0.52, 4.4);
  } else if (style === 'phantom-x') {
    // Ultra widebody aggressive drift silhouette
    bodyGeo = new THREE.BoxGeometry(2.2, 0.5, 4.3);
  } else {
    // Titan Apex: faceted heavy cyber armored chassis
    bodyGeo = new THREE.BoxGeometry(2.1, 0.65, 4.5);
  }

  const mainBody = new THREE.Mesh(bodyGeo, bodyMat);
  mainBody.position.y = 0.45;
  mainBody.castShadow = true;
  mainBody.receiveShadow = true;
  root.add(mainBody);
  root.bodyMesh = mainBody;

  // 2. SECONDARY READ: Cockpit Canopy
  let canopyGeo: THREE.BufferGeometry;
  if (style === 'vortex-xr') {
    // Fighter jet bubble canopy
    canopyGeo = new THREE.SphereGeometry(0.72, 16, 12);
    canopyGeo.scale(1.1, 0.7, 2.2);
  } else {
    canopyGeo = new THREE.BoxGeometry(1.3, 0.45, 1.9);
  }
  const canopy = new THREE.Mesh(canopyGeo, canopyMat);
  canopy.position.set(0, 0.8, -0.1);
  canopy.castShadow = true;
  root.add(canopy);

  // Front Splitter / Bumper
  const splitterGeo = new THREE.BoxGeometry(style === 'phantom-x' ? 2.25 : 1.95, 0.1, 0.6);
  const splitter = new THREE.Mesh(splitterGeo, darkTrimMat);
  splitter.position.set(0, 0.18, 2.05);
  splitter.castShadow = true;
  root.add(splitter);

  // Rear Diffuser
  const diffuserGeo = new THREE.BoxGeometry(1.9, 0.22, 0.5);
  const diffuser = new THREE.Mesh(diffuserGeo, darkTrimMat);
  diffuser.position.set(0, 0.22, -2.1);
  root.add(diffuser);

  // Aerodynamic Rear Spoiler
  const wingGeo = new THREE.BoxGeometry(style === 'phantom-x' ? 2.4 : 1.9, 0.08, 0.4);
  const wing = new THREE.Mesh(wingGeo, bodyMat);
  wing.position.set(0, 1.05, -2.0);
  wing.castShadow = true;

  // Spoiler Mount Struts
  const strutGeo = new THREE.BoxGeometry(0.06, 0.4, 0.2);
  const strutL = new THREE.Mesh(strutGeo, darkTrimMat);
  strutL.position.set(-0.6, 0.85, -1.95);
  const strutR = new THREE.Mesh(strutGeo, darkTrimMat);
  strutR.position.set(0.6, 0.85, -1.95);
  root.add(wing);
  root.add(strutL);
  root.add(strutR);
  root.spoilerMesh = wing;

  // 3. ACCENT DETAIL: Headlights, Taillights, Thrusters, Neon Underglow
  // Headlights (Dual sleek cyber LED slits)
  const headlightGeo = new THREE.BoxGeometry(0.35, 0.08, 0.15);
  const headL = new THREE.Mesh(headlightGeo, headlightMat);
  headL.position.set(-0.7, 0.52, 2.08);
  const headR = new THREE.Mesh(headlightGeo, headlightMat);
  headR.position.set(0.7, 0.52, 2.08);
  root.add(headL);
  root.add(headR);
  headlights.push(headL, headR);

  // Taillight bar (Cyberpunk full-width LED strip)
  const taillightGeo = new THREE.BoxGeometry(1.7, 0.08, 0.1);
  const tailBar = new THREE.Mesh(taillightGeo, taillightMat);
  tailBar.position.set(0, 0.56, -2.18);
  root.add(tailBar);
  taillights.push(tailBar);

  // Quad / Twin Jet Thrusters (Exhaust Ports)
  const thrusterGeo = new THREE.CylinderGeometry(0.12, 0.16, 0.35, 16);
  thrusterGeo.rotateX(Math.PI / 2);
  const thrusterOffsets = style === 'titan-apex' ? [-0.55, -0.2, 0.2, 0.55] : [-0.45, 0.45];

  thrusterOffsets.forEach((posX) => {
    // Housing
    const casing = new THREE.Mesh(thrusterGeo, darkTrimMat);
    casing.position.set(posX, 0.38, -2.12);
    root.add(casing);

    // Glowing core
    const coreGeo = new THREE.CircleGeometry(0.11, 16);
    const coreMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4 });
    const core = new THREE.Mesh(coreGeo, coreMat);
    core.position.set(posX, 0.38, -2.3);
    core.rotation.y = Math.PI;
    root.add(core);
    thrusters.push(core);
  });

  // Neon Underglow Plane (Directly beneath chassis)
  const underglowGeo = new THREE.PlaneGeometry(1.8, 3.6);
  const underglowMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color(neonColorHex),
    transparent: true,
    opacity: 0.7,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const underglow = new THREE.Mesh(underglowGeo, underglowMat);
  underglow.rotation.x = Math.PI / 2;
  underglow.position.y = 0.08;
  root.add(underglow);
  root.underglow = underglow;

  // 4. WHEELS (4 Corner Groups)
  const flWheel = createWheel(wheelWidth, wheelRadius, rimColorHex, true);
  flWheel.position.set(-wheelBaseX, wheelRadius, wheelBaseZ);
  const frWheel = createWheel(wheelWidth, wheelRadius, rimColorHex, true);
  frWheel.position.set(wheelBaseX, wheelRadius, wheelBaseZ);
  const rlWheel = createWheel(wheelWidth, wheelRadius, rimColorHex, false);
  rlWheel.position.set(-wheelBaseX, wheelRadius, -wheelBaseZ);
  const rrWheel = createWheel(wheelWidth, wheelRadius, rimColorHex, false);
  rrWheel.position.set(wheelBaseX, wheelRadius, -wheelBaseZ);

  root.add(flWheel);
  root.add(frWheel);
  root.add(rlWheel);
  root.add(rrWheel);

  root.wheels = [flWheel, frWheel, rlWheel, rrWheel];
  root.frontLeftWheel = flWheel;
  root.frontRightWheel = frWheel;
  root.rearLeftWheel = rlWheel;
  root.rearRightWheel = rrWheel;
  root.thrusterGlows = thrusters;
  root.headlights = headlights;
  root.taillights = taillights;

  return root;
}
