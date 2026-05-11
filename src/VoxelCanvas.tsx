import { useEffect, useRef } from 'react';
import * as THREE from 'three';

type Mode = 'menu' | 'cook' | 'result';

export interface VisualState {
  stepId?: string;
  pulse?: number;
  prepCuts?: number;
  prepActive?: number;
  prepBlade?: number;
  prepChop?: number;
  stirProgress?: number;
  stirTurns?: number;
  stirMarker?: number;
  stirToss?: number;
  stirPull?: number;
  simmerHeat?: number;
  simmerHits?: number;
  simmerReady?: boolean;
  simmerBubble?: number;
  simmerStir?: number;
  simmerStirAngle?: number;
  sauceItems?: string[];
  mashCount?: number;
  mashPress?: number;
  mashPound?: number;
  plateItems?: string[];
}

interface VoxelCanvasProps {
  mode: Mode;
  stepId?: string;
  visualState?: VisualState;
}

interface DynamicRefs {
  prepIngredients: THREE.Object3D[][];
  prepChopped: THREE.Object3D[];
  cleaver?: THREE.Group;
  riceBits: THREE.Object3D[];
  riceMounds: THREE.Object3D[];
  wokAromatics: THREE.Object3D[];
  wokFlames: THREE.Object3D[];
  wokOil?: THREE.Mesh;
  wokSpoon?: THREE.Group;
  potSteam: THREE.Mesh[];
  potBubbles: THREE.Mesh[];
  waterRipples: THREE.Mesh[];
  potChicken?: THREE.Group;
  heatMercury?: THREE.Mesh;
  sauceItems: Record<string, THREE.Object3D[]>;
  sauceMortar?: THREE.Group;
  pestle?: THREE.Group;
  saucePaste?: THREE.Mesh;
  plateParts: Record<string, THREE.Object3D[]>;
  shaderUniforms: { uTime: { value: number }; uPulse: { value: number } }[];
  shaderMeshes: THREE.Mesh[];
}

type CubeFn = (color: string, x: number, y: number, z: number, sx?: number, sy?: number, sz?: number) => THREE.Mesh;
type CylFn = (color: string, x: number, y: number, z: number, sx?: number, sy?: number, sz?: number) => THREE.Mesh;

const C = {
  ink: '#241b18',
  wall: '#214844',
  wall2: '#173532',
  floorA: '#d7c796',
  floorB: '#e9ddb4',
  board: '#a86435',
  boardLight: '#d79a57',
  steel: '#bdc7bd',
  steelDark: '#66736f',
  cream: '#fff4cf',
  rice: '#fff5d7',
  chicken: '#e7bf82',
  chickenDark: '#b87b4a',
  chili: '#d8422d',
  ginger: '#d99a43',
  garlic: '#fff0bf',
  pandan: '#4f9b45',
  shallot: '#b74f85',
  green: '#66aa54',
  yellow: '#eab83a',
  broth: '#94c8b5',
  oil: '#f0b74c',
};

export function VoxelCanvas({ mode, stepId, visualState = {} }: VoxelCanvasProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef(visualState);

  useEffect(() => {
    stateRef.current = visualState;
  }, [visualState]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return undefined;

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: false,
      precision: 'mediump',
      powerPreference: 'default',
      preserveDrawingBuffer: new URLSearchParams(window.location.search).has('pixelCheck'),
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.35));
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    host.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0xf7dca4, 13, 29);

    const camera = new THREE.OrthographicCamera(-4, 4, 4, -4, 0.1, 80);
    camera.position.set(5.35, 6.05, 6.85);
    camera.lookAt(0, 0.62, 0.16);

    scene.add(new THREE.HemisphereLight(0xfff0cf, 0x163c39, 2.55));
    const key = new THREE.DirectionalLight(0xffffff, 2.35);
    key.position.set(4, 8, 6);
    scene.add(key);
    const warm = new THREE.DirectionalLight(0xffb96d, 0.95);
    warm.position.set(-5, 4, -3);
    scene.add(warm);

    const root = new THREE.Group();
    scene.add(root);
    const { dynamics, dispose } = buildScene(root, mode, stepId);
    if (mode === 'cook' && stepId === 'toast-rice') {
      root.position.y = 0.56;
    } else if (mode === 'cook' && stepId === 'poach-chicken') {
      root.position.y = 0.38;
    } else if (mode === 'cook' && stepId === 'make-chili') {
      root.position.y = 1.7;
    }

    const resize = () => {
      const rect = host.getBoundingClientRect();
      const width = Math.max(1, Math.floor(rect.width));
      const height = Math.max(1, Math.floor(rect.height));
      renderer.setSize(width, height, false);
      const aspect = width / height;
      const view = mode === 'cook' ? 3.7 : 4.22;
      camera.left = -view * aspect;
      camera.right = view * aspect;
      camera.top = view;
      camera.bottom = -view;
      camera.updateProjectionMatrix();
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(host);

    let last = 0;
    const frameInterval = mode === 'menu' ? 1000 / 24 : 1000 / 30;
    const animate = (now: number) => {
      if (!document.hidden && now - last >= frameInterval) {
        last = now - ((now - last) % frameInterval);
        const t = now / 1000;
        root.rotation.y = Math.sin(t * 0.28) * 0.035;
        updateDynamics(dynamics, stateRef.current, t);
        renderer.render(scene, camera);
      }
    };
    renderer.setAnimationLoop(animate);
    renderer.render(scene, camera);

    return () => {
      renderer.setAnimationLoop(null);
      observer.disconnect();
      dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [mode, stepId]);

  return <div ref={hostRef} className="game-canvas" aria-hidden />;
}

function buildScene(root: THREE.Group, mode: Mode, stepId?: string) {
  const box = new THREE.BoxGeometry(1, 1, 1);
  const cylinder = new THREE.CylinderGeometry(1, 1, 1, 18);
  const poly = new THREE.DodecahedronGeometry(1, 0);
  const materials = new Map<string, THREE.Material>();
  const meshes: THREE.Mesh[] = [];
  const dynamics: DynamicRefs = {
    prepIngredients: [],
    prepChopped: [],
    riceBits: [],
    riceMounds: [],
    wokAromatics: [],
    wokFlames: [],
    potSteam: [],
    potBubbles: [],
    waterRipples: [],
    sauceItems: {},
    plateParts: {},
    shaderUniforms: [],
    shaderMeshes: [],
  };

  const material = (color: string) => {
    let found = materials.get(color);
    if (!found) {
      found = new THREE.MeshLambertMaterial({ color, flatShading: true });
      materials.set(color, found);
    }
    return found;
  };

  const cube: CubeFn = (color, x, y, z, sx = 1, sy = 1, sz = 1) => {
    const mesh = new THREE.Mesh(box, material(color));
    mesh.position.set(x, y, z);
    mesh.scale.set(sx, sy, sz);
    root.add(mesh);
    meshes.push(mesh);
    return mesh;
  };

  const cyl: CylFn = (color, x, y, z, sx = 1, sy = 1, sz = 1) => {
    const mesh = new THREE.Mesh(cylinder, material(color));
    mesh.position.set(x, y, z);
    mesh.scale.set(sx, sy, sz);
    root.add(mesh);
    meshes.push(mesh);
    return mesh;
  };

  const chunk = (color: string, x: number, y: number, z: number, s = 0.18) => {
    const mesh = new THREE.Mesh(poly, material(color));
    mesh.position.set(x, y, z);
    mesh.scale.set(s, s, s);
    root.add(mesh);
    meshes.push(mesh);
    return mesh;
  };

  floor(cube);
  if (!(mode === 'cook' && (stepId === 'toast-rice' || stepId === 'poach-chicken' || stepId === 'make-chili'))) {
    counter(cube);
  }

  if (mode === 'menu' || mode === 'result') {
    finalPlate(cube, cyl, dynamics, true);
  } else if (stepId === 'prep-aromatics') {
    prepScene(root, cube, cyl, chunk, dynamics);
  } else if (stepId === 'toast-rice') {
    wokScene(root, cube, cyl, chunk, dynamics);
  } else if (stepId === 'poach-chicken') {
    poachScene(root, cube, cyl, chunk, dynamics);
  } else if (stepId === 'make-chili') {
    sauceScene(root, cube, cyl, chunk, dynamics);
  } else {
    finalPlate(cube, cyl, dynamics, false);
  }

  root.traverse((object) => {
    const mesh = object as THREE.Mesh;
    if (mesh.isMesh && !mesh.userData.dynamic) {
      mesh.updateMatrix();
      mesh.matrixAutoUpdate = false;
    }
  });

  return {
    dynamics,
    dispose: () => {
      root.clear();
      box.dispose();
      cylinder.dispose();
      poly.dispose();
      materials.forEach((mat) => mat.dispose());
      dynamics.shaderMeshes.forEach((mesh) => {
        mesh.geometry.dispose();
        const material = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        material.forEach((mat) => mat.dispose());
      });
      dynamics.shaderUniforms.length = 0;
    },
  };
}

function floor(cube: CubeFn) {
  cube(C.wall, 0, 1.85, -5.8, 8.8, 3.6, 0.2);
  cube(C.wall2, 4.35, 1.85, -2.15, 0.2, 3.6, 7.3);
  cube('#f0b85c', -2.65, 2.35, -5.68, 1.6, 0.34, 0.08);
  cube('#d74935', -1.18, 2.36, -5.66, 0.52, 0.36, 0.08);
  cube('#f8e2a8', 2.05, 2.34, -5.66, 1.18, 0.28, 0.08);

  cube('#30241d', 0, -0.39, 0, 9.5, 0.18, 9.5);
  cube('#6e5643', 0, -0.2, 0, 9.15, 0.2, 9.15);
  for (let z = -3.8; z <= 4; z += 1.05) {
    cube(z % 2 > 0 ? '#7a604a' : '#80674f', 0, -0.065, z, 9.05, 0.035, 0.055);
  }
  for (let x = -3.8; x <= 4; x += 1.25) {
    cube('#5a4537', x, -0.045, 0.2, 0.045, 0.035, 8.1);
  }
  cube('#a2754b', -3.3, -0.01, 2.85, 1.1, 0.05, 0.08);
  cube('#d6ac66', -2.1, -0.005, 2.85, 0.85, 0.05, 0.08);
  cube('#4f3a2f', 3.28, 0.01, 2.7, 1.35, 0.06, 0.08);
}

function counter(cube: CubeFn) {
  cube('#1c1816', 0, 0.06, -3.25, 7.3, 0.14, 0.78);
  cube('#4f5f5b', 0, 0.24, -3.25, 6.95, 0.18, 0.6);
  cube('#d5d3c6', -2.85, 0.5, -3.42, 0.62, 0.08, 0.22);
  cube('#c9a35a', 2.4, 0.48, -3.43, 0.82, 0.08, 0.2);
}

function board(cube: CubeFn, x = 0, z = 0.4) {
  cube('#30231d', x, 0.17, z, 3.72, 0.12, 2.22);
  cube(C.board, x, 0.34, z, 3.48, 0.18, 2.0);
  cube(C.boardLight, x - 0.9, 0.47, z - 0.58, 1.2, 0.035, 0.09);
  cube('#815029', x + 0.8, 0.48, z + 0.5, 1.1, 0.035, 0.08);
  cube('#efd3a2', x + 1.48, 0.5, z - 0.82, 0.18, 0.04, 0.18);
}

function prepScene(root: THREE.Group, cube: CubeFn, cyl: CylFn, chunk: (color: string, x: number, y: number, z: number, s?: number) => THREE.Mesh, d: DynamicRefs) {
  board(cube);
  const xs = [-1.15, -0.35, 0.45, 1.2];
  const colors = [C.garlic, C.ginger, C.pandan, C.shallot];
  const shapes = [
    [
      chunk(C.garlic, xs[0] - 0.1, 0.62, 0.28, 0.16),
      chunk('#fff8dc', xs[0] + 0.1, 0.6, 0.37, 0.14),
      chunk('#f7e7b6', xs[0] - 0.02, 0.64, 0.47, 0.12),
      cube('#f6e0a7', xs[0] - 0.01, 0.82, 0.33, 0.05, 0.16, 0.05),
    ],
    [chunk(C.ginger, xs[1], 0.62, 0.35, 0.22), chunk('#b8742b', xs[1] + 0.16, 0.67, 0.22, 0.12)],
    [cube(C.pandan, xs[2] - 0.12, 0.62, 0.34, 0.08, 0.08, 0.68), cube('#7ccf70', xs[2] + 0.06, 0.64, 0.32, 0.08, 0.08, 0.6)],
    [chunk(C.shallot, xs[3], 0.62, 0.34, 0.22), chunk('#db80ad', xs[3] + 0.05, 0.72, 0.2, 0.11)],
  ];
  shapes.flat().forEach((mesh) => {
    mesh.userData.dynamic = true;
  });
  d.prepIngredients = shapes;
  colors.forEach((color, i) => {
    for (let n = 0; n < 5; n++) {
      const bit = cube(color, xs[i] - 0.2 + n * 0.1, 0.52, -0.42 - i * 0.08, 0.08, 0.05, 0.08);
      bit.visible = false;
      bit.userData.dynamic = true;
      d.prepChopped.push(bit);
    }
  });
  const cleaver = new THREE.Group();
  cleaver.userData.dynamic = true;
  root.add(cleaver);
  const blade = cube(C.steel, 0, 1.15, 0.26, 0.48, 0.42, 0.06);
  const edge = cube(C.ink, 0, 0.92, 0.26, 0.54, 0.06, 0.08);
  const handle = cube(C.yellow, 0, 1.46, 0.26, 0.13, 0.42, 0.13);
  [blade, edge, handle].forEach((m) => cleaver.attach(m));
  d.cleaver = cleaver;
}

function wokScene(root: THREE.Group, cube: CubeFn, cyl: CylFn, chunk: (color: string, x: number, y: number, z: number, s?: number) => THREE.Mesh, d: DynamicRefs) {
  cube('#211814', 0, 0.12, 0.4, 3.38, 0.18, 2.4);
  cube('#4d3c32', 0, 0.25, 1.08, 1.46, 0.12, 0.42);
  for (let i = 0; i < 7; i++) {
    const flame = cube(i % 2 ? '#ffb02f' : '#2778ff', -0.48 + i * 0.16, 0.48, 1.06 + (i % 2) * 0.08, 0.08, 0.32, 0.08);
    flame.userData.dynamic = true;
    d.wokFlames.push(flame);
  }
  wok(root, cube, cyl, 0, 0.25, 0.35, d);
  d.wokOil = cyl('#f2b846', -0.12, 0.965, 0.4, 0.26, 0.025, 0.14);
  d.wokOil.userData.dynamic = true;
  cube('#ffd568', 0.28, 0.99, 0.25, 0.1, 0.018, 0.05).rotation.y = -0.28;
  cube('#ffe194', -0.34, 0.99, 0.5, 0.09, 0.018, 0.045).rotation.y = 0.55;
  const lowerRice = cyl(C.rice, 0.02, 1.04, 0.36, 0.58, 0.1, 0.36);
  const topRice = cyl('#fffaf0', -0.03, 1.14, 0.34, 0.42, 0.08, 0.26);
  const sideRice = cyl('#fff8df', 0.18, 1.1, 0.46, 0.25, 0.06, 0.16);
  [lowerRice, topRice, sideRice].forEach((part) => {
    part.userData.dynamic = true;
    d.riceMounds.push(part);
  });
  for (let i = 0; i < 110; i++) {
    const a = i * 2.399;
    const r = 0.02 + Math.sqrt(i / 110) * 0.54;
    const x = Math.cos(a) * r * 0.78;
    const z = 0.35 + Math.sin(a) * r * 0.48;
    const mound = Math.max(0, 1 - r / 0.58) * 0.18;
    const grain = cube(i % 9 === 0 ? '#ffe9b6' : i % 5 === 0 ? '#fff0ca' : '#fffdf4', x, 1.14 + mound + (i % 4) * 0.004, z, 0.044, 0.018, 0.062);
    grain.rotation.y = a;
    grain.rotation.x = (i % 3) * 0.06;
    grain.userData.dynamic = true;
    grain.userData.baseRotationY = a;
    d.riceBits.push(grain);
  }
  const aromatics = [
    chunk(C.garlic, -0.78, 1.13, 0.18, 0.1),
    chunk('#fff9dc', -0.64, 1.12, 0.25, 0.08),
    cube(C.ginger, 0.66, 1.08, 0.2, 0.11, 0.045, 0.09),
    cube('#c87e30', 0.75, 1.1, 0.31, 0.1, 0.04, 0.08),
    cube(C.pandan, -0.44, 1.13, 0.77, 0.06, 0.04, 0.5),
    cube('#76c468', -0.24, 1.12, 0.74, 0.06, 0.04, 0.42),
  ];
  aromatics.forEach((item, i) => {
    item.userData.dynamic = true;
    item.userData.aromaticIndex = i;
    item.rotation.y = i * 0.64;
    d.wokAromatics.push(item);
  });
  const spoon = new THREE.Group();
  spoon.userData.dynamic = true;
  root.add(spoon);
  const paddle = cube(C.steel, -0.2, 1.08, 0.35, 0.34, 0.055, 0.23);
  const lip = cube(C.steelDark, -0.38, 1.1, 0.35, 0.065, 0.08, 0.28);
  const handle = cube('#7a4a29', 0.18, 1.08, 0.35, 0.68, 0.052, 0.08);
  [paddle, lip, handle].forEach((m) => spoon.attach(m));
  d.wokSpoon = spoon;
}

function wok(root: THREE.Group, cube: CubeFn, cyl: CylFn, x: number, y: number, z: number, d?: DynamicRefs) {
  cyl(C.ink, x, y + 0.2, z, 1.55, 0.14, 1.05);
  cyl(C.steelDark, x, y + 0.38, z, 1.34, 0.22, 0.88);
  cyl(C.ink, x, y + 0.55, z, 1.18, 0.08, 0.76);
  const heat = shaderDisk(x, y + 0.63, z, 0.92, '#2a1d18', '#734326');
  root.add(heat.mesh);
  if (d) {
    d.shaderUniforms.push(heat.uniforms);
    d.shaderMeshes.push(heat.mesh);
  }
  cube(C.ink, x - 1.5, y + 0.55, z, 0.62, 0.12, 0.16);
  cube(C.ink, x + 1.5, y + 0.55, z, 0.62, 0.12, 0.16);
}

function poachScene(root: THREE.Group, cube: CubeFn, cyl: CylFn, chunk: (color: string, x: number, y: number, z: number, s?: number) => THREE.Mesh, d: DynamicRefs) {
  cube('#211814', 0, 0.11, 0.25, 3.18, 0.18, 2.34);
  cube('#39291f', 0, 0.24, 1.02, 1.48, 0.14, 0.46);
  cyl(C.ink, 0, 0.34, 0.25, 1.38, 0.22, 0.98);
  cyl(C.steelDark, 0, 0.56, 0.25, 1.24, 0.32, 0.88);
  cyl(C.steel, 0, 0.73, 0.25, 1.12, 0.36, 0.78);
  cyl('#d7ded6', 0, 0.94, 0.25, 1.0, 0.08, 0.7);
  cyl('#7fb7a8', 0, 0.99, 0.25, 0.88, 0.022, 0.58);
  const stock = waterSurface(0, 1.035, 0.25, 0.92, 0.62);
  root.add(stock.mesh);
  d.shaderUniforms.push(stock.uniforms);
  d.shaderMeshes.push(stock.mesh);
  [
    waterRing(0, 1.065, 0.25, 0.37, 0.385, '#eefdf0', 0.48),
    waterRing(0.03, 1.07, 0.25, 0.62, 0.635, '#ffffff', 0.24),
    waterRing(-0.28, 1.073, 0.17, 0.18, 0.192, '#fff6d7', 0.36),
  ].forEach((ring, i) => {
    ring.userData.dynamic = true;
    ring.userData.rippleIndex = i;
    d.waterRipples.push(ring);
    d.shaderMeshes.push(ring);
    root.add(ring);
  });
  d.potChicken = chicken(root, cube, cyl, chunk, 0, 1.14, 0.2, 0.92);
  for (let i = 0; i < 5; i++) {
    const steam = cube(i % 2 ? '#e8fff0' : '#f4fff7', -0.68 + i * 0.34, 1.44 + i * 0.09, -0.36 + (i % 2) * 0.12, 0.06, 0.18, 0.06);
    steam.userData.dynamic = true;
    d.potSteam.push(steam);
    const bubble = chunk('#e8fff0', -0.5 + i * 0.25, 1.06, 0.05 + (i % 2) * 0.24, 0.055);
    bubble.userData.dynamic = true;
    d.potBubbles.push(bubble);
  }
  cube(C.steelDark, -1.28, 0.72, 0.28, 0.34, 0.12, 0.16);
  cube(C.steelDark, 1.28, 0.72, 0.28, 0.34, 0.12, 0.16);
  cube(C.ink, 1.34, 0.68, 0.6, 0.13, 1.26, 0.13);
  cube(C.cream, 1.34, 0.67, 0.6, 0.07, 1.1, 0.07);
  d.heatMercury = cube(C.chili, 1.34, 0.27, 0.6, 0.09, 0.2, 0.09);
  d.heatMercury.userData.dynamic = true;
  cube(C.yellow, 1.34, 1.26, 0.6, 0.23, 0.14, 0.2);
}

function sauceScene(root: THREE.Group, cube: CubeFn, cyl: CylFn, chunk: (color: string, x: number, y: number, z: number, s?: number) => THREE.Mesh, d: DynamicRefs) {
  board(cube, 0, 0.5);
  const mortar = new THREE.Group();
  mortar.userData.dynamic = true;
  root.add(mortar);
  [
    cyl('#211a17', 0, 0.54, 0.5, 0.78, 0.18, 0.58),
    cyl('#5d4d43', 0, 0.72, 0.5, 0.62, 0.44, 0.46),
    cyl('#8b7668', 0, 0.99, 0.5, 0.42, 0.12, 0.3),
  ].forEach((part) => mortar.attach(part));
  d.sauceMortar = mortar;
  d.saucePaste = cyl(C.chili, 0, 1.08, 0.5, 0.3, 0.08, 0.22);
  d.saucePaste.userData.dynamic = true;
  d.sauceItems.chili = [
    cube(C.chili, -1.5, 0.64, -0.44, 0.12, 0.12, 0.58),
    cube('#a92d27', -1.5, 0.66, -0.2, 0.1, 0.1, 0.18),
    cube(C.green, -1.5, 0.7, -0.78, 0.08, 0.08, 0.12),
  ];
  d.sauceItems.chili[0].rotation.x = 0.18;
  d.sauceItems.ginger = [
    chunk(C.ginger, -0.52, 0.66, -0.44, 0.16),
    chunk('#efc474', -0.36, 0.7, -0.3, 0.12),
    cube('#b87232', -0.54, 0.77, -0.44, 0.18, 0.035, 0.1),
  ];
  d.sauceItems.garlic = [
    chunk(C.garlic, 0.45, 0.66, -0.44, 0.16),
    chunk('#fff7d9', 0.32, 0.68, -0.34, 0.11),
    chunk('#fff7d9', 0.58, 0.68, -0.34, 0.11),
    cube('#d7c8aa', 0.45, 0.84, -0.46, 0.07, 0.12, 0.07),
  ];
  d.sauceItems.lime = [
    cyl(C.green, 1.36, 0.66, -0.44, 0.2, 0.14, 0.2),
    cyl('#d8f08a', 1.36, 0.77, -0.44, 0.16, 0.045, 0.16),
    cube('#3f8f43', 1.5, 0.7, -0.44, 0.05, 0.1, 0.24),
  ];
  Object.values(d.sauceItems).forEach((parts) => {
    parts.forEach((mesh) => {
      mesh.userData.dynamic = true;
    });
  });
  const pestle = new THREE.Group();
  pestle.userData.dynamic = true;
  root.add(pestle);
  const shaft = cube(C.cream, 0.56, 1.3, 0.38, 0.17, 0.96, 0.17);
  const tip = cyl(C.steel, 0.18, 0.92, 0.48, 0.18, 0.2, 0.18);
  shaft.rotation.z = -0.68;
  tip.rotation.z = -0.68;
  [shaft, tip].forEach((m) => pestle.attach(m));
  d.pestle = pestle;
}

function finalPlate(cube: CubeFn, cyl: CylFn, d: DynamicRefs, full: boolean) {
  cyl(C.ink, 0, 0.32, 0.36, 1.6, 0.16, 1.05);
  cyl(C.cream, 0, 0.45, 0.36, 1.42, 0.12, 0.9);
  const rice = [
    cyl(C.rice, -0.58, 0.68, 0.3, 0.45, 0.22, 0.34),
    cyl('#fff9e6', -0.58, 0.86, 0.3, 0.32, 0.18, 0.24),
    cube('#fffdf2', -0.76, 0.86, 0.14, 0.09, 0.06, 0.09),
    cube('#fffdf2', -0.44, 0.9, 0.2, 0.08, 0.05, 0.08),
    cube('#fff8df', -0.58, 1.0, 0.36, 0.09, 0.06, 0.09),
    cube('#fff8df', -0.7, 0.77, 0.47, 0.08, 0.05, 0.08),
  ];
  const chickenParts = Array.from({ length: 7 }, (_, i) => [
    cube(C.chicken, 0.12 + i * 0.13, 0.73 + i * 0.01, 0.02, 0.1, 0.09, 0.58),
    cube(C.chickenDark, 0.12 + i * 0.13, 0.81 + i * 0.01, -0.24, 0.11, 0.035, 0.2),
  ]).flat();
  const cucumber = Array.from({ length: 4 }, (_, i) => cube(C.green, -0.24 + i * 0.13, 0.74, 0.78, 0.1, 0.07, 0.38));
  const chili = [
    cyl('#7c3b2f', 0.9, 0.73, 0.68, 0.26, 0.1, 0.2),
    cyl(C.chili, 0.9, 0.83, 0.68, 0.2, 0.06, 0.15),
  ];
  d.plateParts = { rice, chicken: chickenParts, cucumber, chili };
  Object.entries(d.plateParts).forEach(([id, parts]) => {
    parts.forEach((p) => {
      p.userData.dynamic = true;
      p.userData.fullPlate = full;
      p.visible = full;
      p.userData.plateId = id;
    });
  });
}

function chicken(root: THREE.Group, cube: CubeFn, cyl: CylFn, chunk: (color: string, x: number, y: number, z: number, s?: number) => THREE.Mesh, x: number, y: number, z: number, s: number) {
  const group = new THREE.Group();
  group.userData.dynamic = true;
  root.add(group);
  const body = chunk('#e7b675', x, y + 0.02 * s, z, 0.5 * s);
  body.scale.set(0.66 * s, 0.35 * s, 0.5 * s);
  body.rotation.y = -0.12;
  const breast = chunk('#f6d7a3', x - 0.04 * s, y + 0.26 * s, z - 0.05 * s, 0.38 * s);
  breast.scale.set(0.44 * s, 0.18 * s, 0.3 * s);
  breast.rotation.y = -0.1;
  const back = chunk('#d19359', x + 0.04 * s, y - 0.02 * s, z + 0.14 * s, 0.34 * s);
  back.scale.set(0.44 * s, 0.1 * s, 0.22 * s);
  const leftWing = chunk('#d5965c', x - 0.44 * s, y + 0.08 * s, z + 0.02 * s, 0.16 * s);
  leftWing.scale.set(0.18 * s, 0.1 * s, 0.3 * s);
  leftWing.rotation.y = -0.38;
  leftWing.rotation.z = -0.16;
  const rightWing = chunk('#d5965c', x + 0.44 * s, y + 0.08 * s, z + 0.02 * s, 0.16 * s);
  rightWing.scale.set(0.18 * s, 0.1 * s, 0.3 * s);
  rightWing.rotation.y = 0.38;
  rightWing.rotation.z = 0.16;
  const leftLeg = cyl('#dda365', x - 0.27 * s, y + 0.02 * s, z + 0.48 * s, 0.12 * s, 0.48 * s, 0.12 * s);
  leftLeg.rotation.x = Math.PI / 2;
  leftLeg.rotation.z = -0.22;
  const rightLeg = cyl('#dda365', x + 0.27 * s, y + 0.02 * s, z + 0.48 * s, 0.12 * s, 0.48 * s, 0.12 * s);
  rightLeg.rotation.x = Math.PI / 2;
  rightLeg.rotation.z = 0.22;
  const leftDrum = chunk('#efc98f', x - 0.32 * s, y + 0.11 * s, z + 0.3 * s, 0.18 * s);
  leftDrum.scale.set(0.18 * s, 0.13 * s, 0.17 * s);
  const rightDrum = chunk('#efc98f', x + 0.32 * s, y + 0.11 * s, z + 0.3 * s, 0.18 * s);
  rightDrum.scale.set(0.18 * s, 0.13 * s, 0.17 * s);
  const leftBone = cube('#fff2cf', x - 0.3 * s, y + 0.06 * s, z + 0.78 * s, 0.08 * s, 0.08 * s, 0.16 * s);
  leftBone.rotation.z = -0.18;
  const rightBone = cube('#fff2cf', x + 0.3 * s, y + 0.06 * s, z + 0.78 * s, 0.08 * s, 0.08 * s, 0.16 * s);
  rightBone.rotation.z = 0.18;
  const breastRidge = cube('#fff0bd', x - 0.01 * s, y + 0.42 * s, z - 0.08 * s, 0.08 * s, 0.04 * s, 0.48 * s);
  breastRidge.rotation.y = -0.06;
  const parts = [body, breast, back, leftWing, rightWing, leftLeg, rightLeg, leftDrum, rightDrum, leftBone, rightBone, breastRidge];
  parts.forEach((part) => group.attach(part));
  return group;
}

function shaderDisk(x: number, y: number, z: number, radius: number, colorA: string, colorB: string) {
  const uniforms = {
    uTime: { value: 0 },
    uPulse: { value: 0 },
    uColorA: { value: new THREE.Color(colorA) },
    uColorB: { value: new THREE.Color(colorB) },
  };
  const material = new THREE.ShaderMaterial({
    uniforms,
    transparent: true,
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader:
      'uniform float uTime; uniform float uPulse; uniform vec3 uColorA; uniform vec3 uColorB; varying vec2 vUv; void main(){ float wave = sin((vUv.x + vUv.y) * 18.0 + uTime * 2.5) * 0.5 + 0.5; float ring = smoothstep(0.72, 0.15, distance(vUv, vec2(0.5))); vec3 color = mix(uColorA, uColorB, wave * 0.28 + uPulse * 0.22); gl_FragColor = vec4(color, ring * 0.88); }',
  });
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, 0.05, 28), material);
  mesh.position.set(x, y, z);
  mesh.userData.dynamic = true;
  return { mesh, uniforms };
}

function waterSurface(x: number, y: number, z: number, radiusX: number, radiusZ: number) {
  const uniforms = {
    uTime: { value: 0 },
    uPulse: { value: 0 },
  };
  const material = new THREE.ShaderMaterial({
    uniforms,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    vertexShader:
      'uniform float uTime; varying vec2 vUv; varying float vWave; void main(){ vUv = uv; vec3 p = position; float edge = 1.0 - smoothstep(0.28, 0.5, distance(uv, vec2(0.5))); float wave = (sin(p.x * 9.0 + uTime * 2.1) + sin(p.y * 11.0 - uTime * 2.7)) * 0.014 * edge; p.z += wave; vWave = wave; gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0); }',
    fragmentShader:
      'uniform float uTime; uniform float uPulse; varying vec2 vUv; varying float vWave; void main(){ float d = distance(vUv, vec2(0.5)); float edge = 1.0 - smoothstep(0.46, 0.5, d); float ripple = sin(d * 58.0 - uTime * 3.4) * 0.5 + 0.5; float glint = smoothstep(0.72, 1.0, sin((vUv.x - vUv.y) * 18.0 + uTime * 2.8) * 0.5 + 0.5); vec3 stock = vec3(0.45, 0.73, 0.64); vec3 shallow = vec3(0.82, 0.98, 0.88); vec3 foam = vec3(1.0, 0.98, 0.83); vec3 color = mix(stock, shallow, 0.34 + ripple * 0.2 + vWave * 7.0); color = mix(color, foam, glint * 0.18 + uPulse * 0.04); float alpha = edge * (0.52 + ripple * 0.12 + glint * 0.1); gl_FragColor = vec4(color, alpha); }',
  });
  const mesh = new THREE.Mesh(new THREE.CircleGeometry(1, 64), material);
  mesh.position.set(x, y, z);
  mesh.rotation.x = -Math.PI / 2;
  mesh.scale.set(radiusX, radiusZ, 1);
  mesh.renderOrder = 1;
  mesh.userData.dynamic = true;
  return { mesh, uniforms };
}

function waterRing(x: number, y: number, z: number, inner: number, outer: number, color: string, opacity: number) {
  const material = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(new THREE.RingGeometry(inner, outer, 64), material);
  mesh.position.set(x, y, z);
  mesh.rotation.x = -Math.PI / 2;
  mesh.scale.set(1, 0.68, 1);
  mesh.renderOrder = 2;
  mesh.userData.baseOpacity = opacity;
  return mesh;
}

function updateDynamics(d: DynamicRefs, state: VisualState, t: number) {
  d.shaderUniforms.forEach((u) => {
    u.uTime.value = t;
    u.uPulse.value = Math.min(1, Math.max(0, state.stirProgress ?? state.simmerHeat ?? 0));
  });

  const prepCuts = state.prepCuts ?? 0;
  const prepActive = state.prepActive ?? Math.min(prepCuts, 3);
  const prepCenters = [-1.15, -0.35, 0.45, 1.2];
  const chopAge = state.prepChop ? t - state.prepChop / 1000 : 999;
  const recentChop = chopAge >= 0 && chopAge < 0.58;
  d.prepIngredients.forEach((parts, i) => {
    const done = i < prepCuts;
    const visible = i === prepActive && !done;
    const shift = -prepCenters[i];
    parts.forEach((part, p) => {
      const base = basePosition(part);
      const scale = baseScale(part);
      const pulse = visible ? 1.35 + Math.sin(t * 8 + p) * 0.06 : 1;
      part.visible = visible;
      part.position.set(base.x + shift, base.y + 0.08 + Math.sin(t * 3 + i + p) * 0.018, base.z - 0.06);
      part.scale.set(scale.x * pulse, scale.y * pulse, scale.z * pulse);
    });
  });
  d.prepChopped.forEach((bit, i) => {
    const ingredient = Math.floor(i / 5);
    const piece = i % 5;
    const base = basePosition(bit);
    const scale = baseScale(bit);
    const showCenter = recentChop && ingredient === prepActive;
    bit.visible = ingredient < prepCuts;
    bit.position.set(
      showCenter ? (piece - 2) * 0.11 : base.x,
      base.y + (showCenter ? 0.08 + Math.sin(t * 10 + i) * 0.025 : 0),
      showCenter ? 0.2 + (piece % 2) * 0.12 : base.z,
    );
    bit.scale.set(scale.x * (showCenter ? 1.35 : 1), scale.y, scale.z * (showCenter ? 1.35 : 1));
    bit.rotation.y = t * 0.6 + i;
  });
  if (d.cleaver) {
    const blade = state.prepBlade ?? 0.5;
    const drop = recentChop && chopAge < 0.18 ? 0.38 * (1 - chopAge / 0.18) : 0;
    d.cleaver.position.set(-0.78 + blade * 1.56, 0.1 + Math.abs(Math.sin(t * 5)) * 0.05 - drop, 0);
    d.cleaver.rotation.z = Math.sin(t * 8) * 0.025;
  }

  const stir = state.stirProgress ?? 0;
  const stirPull = state.stirPull ?? 0;
  const stirTossAge = state.stirToss ? t - state.stirToss / 1000 : 999;
  const recentToss = stirTossAge >= 0 && stirTossAge < 0.5;
  const tossArc = recentToss ? Math.sin((stirTossAge / 0.5) * Math.PI) : 0;
  d.wokFlames.forEach((flame, i) => {
    const base = basePosition(flame);
    const scale = baseScale(flame);
    const flicker = 0.76 + Math.sin(t * 10 + i) * 0.12 + (i % 2) * 0.08;
    flame.position.y = base.y + flicker * 0.05;
    flame.scale.set(scale.x, scale.y * flicker, scale.z);
  });
  if (d.wokOil) {
    const base = baseScale(d.wokOil);
    d.wokOil.scale.set(base.x * (1 + stir * 0.18 + tossArc * 0.05), base.y, base.z * (1 + stir * 0.18 + tossArc * 0.05));
  }
  d.riceMounds.forEach((mound, i) => {
    const base = basePosition(mound);
    const scale = baseScale(mound);
    mound.position.y = base.y + tossArc * (0.05 + i * 0.05) + stirPull * 0.035;
    mound.scale.set(
      scale.x * (1 + stir * 0.08 + tossArc * 0.06 + stirPull * 0.03),
      scale.y,
      scale.z * (1 + stir * 0.08 + tossArc * 0.06 + stirPull * 0.03),
    );
  });
  d.riceBits.forEach((grain, i) => {
    const base = basePosition(grain);
    const scale = baseScale(grain);
    const drift = Math.sin(t * (2.6 + stir * 2.4) + i) * 0.025 * (0.4 + stir);
    const lift = tossArc * (0.2 + (i % 5) * 0.03) + stirPull * (0.04 + (i % 3) * 0.012);
    grain.position.x = base.x * (1 + stir * 0.18) + Math.cos(i * 1.7) * tossArc * 0.08 + drift;
    grain.position.z = 0.35 + (base.z - 0.35) * (1 + stir * 0.12) + Math.sin(i * 1.3) * tossArc * 0.06;
    grain.position.y = base.y + Math.sin(t * 8 + i) * 0.016 * (0.3 + stir) + lift;
    grain.scale.set(scale.x * (1 + stir * 0.16), scale.y, scale.z * (1 + stir * 0.16));
    grain.rotation.y = ((grain.userData.baseRotationY as number | undefined) ?? i) + tossArc * 1.2 + stir * 0.35;
    grain.rotation.x = tossArc * 0.65 + stir * 0.16;
  });
  d.wokAromatics.forEach((item, i) => {
    const base = basePosition(item);
    const towardRice = stir * 0.12;
    item.position.x = base.x * (1 - towardRice) + Math.sin(t * 2 + i) * 0.015 + tossArc * Math.cos(i) * 0.04;
    item.position.z = 0.35 + (base.z - 0.35) * (1 - towardRice) + tossArc * Math.sin(i) * 0.04;
    item.position.y = base.y + Math.sin(t * 4 + i) * 0.01 + tossArc * (0.16 + (i % 3) * 0.03) + stirPull * 0.04;
    item.rotation.y = t * 0.35 + i;
  });
  if (d.wokSpoon) {
    d.wokSpoon.position.x = 0.56 - tossArc * 0.34 - stirPull * 0.18;
    d.wokSpoon.position.z = 0.48 - tossArc * 0.16 - stirPull * 0.08;
    d.wokSpoon.position.y = Math.sin(t * 5) * 0.01 - tossArc * 0.07 + stirPull * 0.05;
    d.wokSpoon.rotation.y = -0.35 - tossArc * 0.42 + stir * 0.25 - stirPull * 0.18;
    d.wokSpoon.rotation.z = -0.04 - tossArc * 0.18 - stirPull * 0.2;
  }

  if (d.heatMercury) {
    const heat = state.simmerHeat ?? 0.2;
    d.heatMercury.scale.y = 0.18 + heat * 0.95;
    d.heatMercury.position.y = 0.16 + d.heatMercury.scale.y * 0.5;
  }
  const simmerStir = state.simmerStir ?? 0;
  const simmerStirAngle = state.simmerStirAngle ?? 0;
  if (d.potChicken) {
    d.potChicken.position.y = Math.sin(t * 2.6) * 0.025 + (state.simmerReady ? 0.06 : 0) + simmerStir * 0.018;
    d.potChicken.rotation.y = simmerStirAngle * 0.04;
    d.potChicken.rotation.z = Math.sin(t * 1.2) * 0.025 + simmerStir * Math.sin(simmerStirAngle) * 0.035;
  }
  d.waterRipples.forEach((ring, i) => {
    const base = baseScale(ring);
    const shimmer = 1 + Math.sin(t * (0.9 + i * 0.22) + i) * 0.018 + (state.simmerReady ? 0.016 : 0) + simmerStir * 0.035;
    ring.scale.set(base.x * shimmer, base.y * (1 + (shimmer - 1) * 0.7), base.z);
    ring.rotation.z = Math.sin(t * 0.45 + i) * 0.06 + simmerStirAngle * (0.03 + i * 0.01);
    const material = ring.material as THREE.MeshBasicMaterial;
    material.opacity = ((ring.userData.baseOpacity as number | undefined) ?? 0.3) * (0.8 + Math.sin(t * 1.4 + i) * 0.16 + (state.simmerReady ? 0.14 : 0) + simmerStir * 0.18);
  });
  d.potSteam.forEach((steam, i) => {
    const base = basePosition(steam);
    const scale = baseScale(steam);
    const rise = (t * (0.45 + (state.simmerReady ? 0.35 : 0.08)) + i * 0.18) % 1.1;
    const puff = 1 + rise * 0.9;
    steam.visible = true;
    steam.position.set(base.x + Math.sin(t * 1.5 + i) * 0.035, base.y + rise, base.z);
    steam.scale.set(scale.x * puff, scale.y * puff, scale.z * puff);
  });
  d.potBubbles.forEach((bubble, i) => {
    const base = basePosition(bubble);
    const scale = baseScale(bubble);
    const hits = state.simmerHits ?? 0;
    const phase = i === 0 ? (state.simmerBubble ?? 0) : ((state.simmerBubble ?? 0) + i * 0.19) % 1;
    const live = state.simmerReady ? 1 : 0.45;
    const pop = 1 + Math.sin(t * 5 + i) * 0.16 + hits * 0.1 + (i === 0 ? live * 0.7 : 0);
    bubble.visible = i <= hits + 2 || Boolean(state.simmerReady);
    bubble.position.set(base.x + Math.sin(t * 1.4 + i) * 0.03, base.y + phase * 0.3, base.z + Math.cos(t * 1.1 + i) * 0.02);
    bubble.scale.set(scale.x * pop, scale.y * pop, scale.z * pop);
  });

  const sauceItems = new Set(state.sauceItems ?? []);
  const mash = state.mashCount ?? 0;
  const mashPress = state.mashPress ?? 0;
  const poundAge = state.mashPound ? t - state.mashPound / 1000 : 999;
  const strike = poundAge >= 0 && poundAge < 0.24 ? Math.sin((1 - poundAge / 0.24) * Math.PI) : 0;
  const mortarTargets: Record<string, THREE.Vector3> = {
    chili: new THREE.Vector3(-0.17, 1.14, 0.43),
    ginger: new THREE.Vector3(0.06, 1.16, 0.34),
    garlic: new THREE.Vector3(0.18, 1.14, 0.52),
    lime: new THREE.Vector3(-0.04, 1.17, 0.62),
  };
  Object.entries(d.sauceItems).forEach(([id, parts], i) => {
    const added = sauceItems.has(id);
    parts.forEach((part, p) => {
      const base = basePosition(part);
      const scale = baseScale(part);
      part.visible = true;
      if (added) {
        const target = mortarTargets[id] ?? new THREE.Vector3(0, 1.14, 0.5);
        const spreadX = ((p % 3) - 1) * 0.08;
        const spreadZ = (Math.floor(p / 3) - 0.35) * 0.08;
        const settle = clamp(mash / 4 + mashPress * 0.16 + strike * 0.12, 0, 0.82);
        const chunkScale = 1 - settle * 0.58;
        part.position.set(
          target.x + spreadX + Math.sin(t * 2.2 + p) * 0.008,
          target.y + Math.sin(t * 4 + i + p) * 0.008 - mashPress * 0.035 - strike * 0.045,
          target.z + spreadZ + Math.cos(t * 2 + p) * 0.008,
        );
        part.scale.set(scale.x * chunkScale, scale.y * Math.max(0.28, chunkScale), scale.z * chunkScale);
        part.rotation.y = ((part.userData.baseRotationY as number | undefined) ?? i) + mash * 0.25 + p * 0.2;
      } else {
        part.position.set(base.x, base.y + Math.sin(t * 3 + i + p) * 0.012, base.z);
        part.scale.copy(scale);
      }
    });
  });
  if (d.pestle) {
    d.pestle.position.y = Math.sin(t * 5 + mash) * 0.04 - mash * 0.018 - mashPress * 0.34 - strike * 0.24;
    d.pestle.rotation.z = -0.08 + Math.sin(t * 3) * 0.035 + mashPress * 0.12 - strike * 0.08;
  }
  if (d.sauceMortar) {
    const scale = baseScale(d.sauceMortar);
    const pulse = 1 + Math.sin(t * 12) * 0.018 * mash + strike * 0.06;
    d.sauceMortar.scale.set(scale.x * pulse, scale.y, scale.z * pulse);
  }
  if (d.saucePaste) {
    const amount = (state.sauceItems?.length ?? 0) / 4 + mash / 10 + mashPress * 0.06 + strike * 0.04;
    d.saucePaste.scale.set(0.42 + amount * 0.24, 0.08 + amount * 0.04, 0.3 + amount * 0.16);
  }

  const plated = new Set(state.plateItems ?? []);
  Object.entries(d.plateParts).forEach(([id, parts], i) => {
    parts.forEach((part, p) => {
      const base = basePosition(part);
      const visible = state.plateItems ? plated.has(id) : Boolean(part.userData.fullPlate);
      part.visible = visible;
      part.position.set(base.x, base.y + Math.sin(t * 4 + i + p) * 0.014, base.z);
    });
  });
}

function basePosition(object: THREE.Object3D) {
  if (!object.userData.basePosition) {
    object.userData.basePosition = object.position.clone();
  }
  return object.userData.basePosition as THREE.Vector3;
}

function baseScale(object: THREE.Object3D) {
  if (!object.userData.baseScale) {
    object.userData.baseScale = object.scale.clone();
  }
  return object.userData.baseScale as THREE.Vector3;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
