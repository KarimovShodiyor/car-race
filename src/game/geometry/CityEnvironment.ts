import * as THREE from 'three';

/**
 * Procedural Cyberpunk Megacity Environment Generator
 * Generates skyscrapers, holographic billboards, sky traffic, and neon highway infrastructure.
 */

// Procedural texture cache for windows and holograms
function createBuildingTexture(neonColor: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#0a0d14';
  ctx.fillRect(0, 0, 128, 256);

  // Lit window grid
  const cols = 8;
  const rows = 24;
  const w = 9;
  const h = 6;
  const padX = 7;
  const padY = 5;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const isLit = Math.random() > 0.45;
      if (isLit) {
        const rand = Math.random();
        if (rand > 0.8) {
          ctx.fillStyle = neonColor;
        } else if (rand > 0.5) {
          ctx.fillStyle = '#38bdf8';
        } else {
          ctx.fillStyle = '#fef08a';
        }
        ctx.fillRect(c * (w + padX) + 4, r * (h + padY) + 4, w, h);
      }
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createHologramTexture(text: string, bgColor: string, fgColor: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  // Hologram scanline background
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, 512, 256);

  // Scanlines
  ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
  for (let y = 0; y < 256; y += 4) {
    ctx.fillRect(0, y, 512, 2);
  }

  // Border neon frame
  ctx.strokeStyle = fgColor;
  ctx.lineWidth = 8;
  ctx.strokeRect(10, 10, 492, 236);

  // Glowing Text
  ctx.font = 'bold 38px monospace';
  ctx.fillStyle = fgColor;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = fgColor;
  ctx.shadowBlur = 15;
  ctx.fillText(text, 256, 110);

  ctx.font = '20px monospace';
  ctx.fillStyle = '#ffffff';
  ctx.fillText('>>> SYSTEM ONLINE <<<', 256, 170);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export interface FlyingVehicle {
  mesh: THREE.Group;
  speed: number;
  startX: number;
  endX: number;
  height: number;
  z: number;
}

export class CityEnvironment {
  public rootGroup: THREE.Group;
  public flyingVehicles: FlyingVehicle[] = [];
  private billboardMaterials: THREE.MeshBasicMaterial[] = [];

  constructor() {
    this.rootGroup = new THREE.Group();
    this.buildCity();
    this.buildSkyTraffic();
  }

  private buildCity() {
    const bldgColors = ['#06b6d4', '#ec4899', '#8b5cf6', '#3b82f6'];
    const textures = bldgColors.map((c) => createBuildingTexture(c));

    const boxGeo = new THREE.BoxGeometry(1, 1, 1);

    // Generate cluster of skyscrapers alongside track
    const buildingCount = 70;
    for (let i = 0; i < buildingCount; i++) {
      const tex = textures[i % textures.length];
      const mat = new THREE.MeshStandardMaterial({
        color: 0x111827,
        roughness: 0.35,
        metalness: 0.8,
        map: tex,
      });

      const bldg = new THREE.Mesh(boxGeo, mat);
      const width = 25 + Math.random() * 35;
      const depth = 25 + Math.random() * 35;
      const height = 80 + Math.random() * 220;

      // Position buildings on flanks (-X and +X) away from central track
      const side = Math.random() > 0.5 ? 1 : -1;
      const posX = side * (55 + Math.random() * 250);
      const posZ = (Math.random() - 0.5) * 1200;

      bldg.scale.set(width, height, depth);
      bldg.position.set(posX, height / 2, posZ);
      bldg.castShadow = true;
      bldg.receiveShadow = true;
      this.rootGroup.add(bldg);

      // Rooftop neon beacon / spire
      if (Math.random() > 0.4) {
        const spireGeo = new THREE.CylinderGeometry(0.2, 0.8, 25, 8);
        const spireMat = new THREE.MeshBasicMaterial({
          color: bldgColors[i % bldgColors.length],
        });
        const spire = new THREE.Mesh(spireGeo, spireMat);
        spire.position.set(posX, height + 12.5, posZ);
        this.rootGroup.add(spire);
      }

      // Holographic billboard on select skyscrapers
      if (Math.random() > 0.65) {
        const titles = ['NEON CORP', 'CYBER-SPEED', 'HYPER-DRIVE', 'NIGHT CITY 2099', 'PULSE OVERLOAD'];
        const text = titles[i % titles.length];
        const billboardTex = createHologramTexture(text, 'rgba(5, 10, 25, 0.85)', bldgColors[i % bldgColors.length]);
        const billboardMat = new THREE.MeshBasicMaterial({
          map: billboardTex,
          transparent: true,
          opacity: 0.9,
          side: THREE.DoubleSide,
        });
        this.billboardMaterials.push(billboardMat);

        const billboard = new THREE.Mesh(new THREE.PlaneGeometry(36, 18), billboardMat);
        // Face toward center track
        billboard.position.set(posX - side * (width / 2 + 1), height * 0.7, posZ);
        billboard.rotation.y = side > 0 ? -Math.PI / 2 : Math.PI / 2;
        this.rootGroup.add(billboard);
      }
    }
  }

  private buildSkyTraffic() {
    // Generate upper atmosphere flying hovercars with light trails
    const hoverCount = 12;
    for (let i = 0; i < hoverCount; i++) {
      const vGroup = new THREE.Group();

      // Sleek flying vehicle hull
      const hullGeo = new THREE.ConeGeometry(2, 8, 4);
      hullGeo.rotateX(Math.PI / 2);
      const hullMat = new THREE.MeshStandardMaterial({
        color: 0x0f172a,
        metalness: 0.9,
        roughness: 0.2,
      });
      const hull = new THREE.Mesh(hullGeo, hullMat);
      vGroup.add(hull);

      // Glowing light trail
      const trailGeo = new THREE.CylinderGeometry(0.15, 0.4, 18, 8);
      trailGeo.rotateX(Math.PI / 2);
      const trailMat = new THREE.MeshBasicMaterial({
        color: i % 2 === 0 ? 0x06b6d4 : 0xec4899,
        transparent: true,
        opacity: 0.7,
      });
      const trail = new THREE.Mesh(trailGeo, trailMat);
      trail.position.z = -10;
      vGroup.add(trail);

      const height = 90 + Math.random() * 110;
      const z = (Math.random() - 0.5) * 1000;
      const speed = 40 + Math.random() * 50;
      const startX = -600;
      const endX = 600;

      vGroup.position.set(startX + Math.random() * 1200, height, z);
      vGroup.rotation.y = Math.PI / 2;
      this.rootGroup.add(vGroup);

      this.flyingVehicles.push({
        mesh: vGroup,
        speed,
        startX,
        endX,
        height,
        z,
      });
    }
  }

  public update(delta: number) {
    // Animate flying vehicles across the sky
    for (const fv of this.flyingVehicles) {
      fv.mesh.position.x += fv.speed * delta;
      if (fv.mesh.position.x > fv.endX) {
        fv.mesh.position.x = fv.startX;
      }
    }
  }
}
