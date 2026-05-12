import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { STATION_BY_ID, STATIONS, type HeldItem, type PlateComponent, type StationId, type StationItem } from './gameData';

export interface VisualStationState {
  item: StationItem | null;
  progress: number;
  overcooked: boolean;
}

export interface KitchenVisualState {
  player: { x: number; z: number; facing: number; moving: boolean };
  held: HeldItem | null;
  stations: Record<StationId, VisualStationState>;
  plate: Record<PlateComponent, boolean>;
  nearStation: StationId | null;
  targetStation: StationId | null;
  activeStation: StationId | null;
  activeProgress: number;
  pulseStation: StationId | null;
  pulseKey: number;
  served: boolean;
}

interface DynamicRefs {
  chef: THREE.Group;
  chefBody: THREE.Mesh;
  leftArm: THREE.Mesh;
  rightArm: THREE.Mesh;
  heldItems: Record<HeldItem, THREE.Group>;
  guideArrow: THREE.Sprite;
  highlights: Record<StationId, THREE.Mesh>;
  progressBars: Partial<Record<StationId, THREE.Mesh>>;
  fridgeDoor: THREE.Group;
  pantrySack: THREE.Group;
  boardRawChicken: THREE.Group;
  boardCutChicken: THREE.Group;
  knife: THREE.Group;
  riceBowl: THREE.Group;
  riceItem: THREE.Group;
  riceSteam: THREE.Group[];
  potWater: THREE.Mesh;
  potChicken: THREE.Group;
  potSteam: THREE.Group[];
  potBubbles: THREE.Mesh[];
  mortarIngredients: THREE.Group;
  mortarSauce: THREE.Group;
  pestle: THREE.Group;
  plateItems: Record<PlateComponent, THREE.Group>;
  bell: THREE.Group;
  trashLid: THREE.Group;
  pulseStation: StationId | null;
  pulseStart: number;
  lastPulseKey: number;
}

const COLORS = {
  wall: '#60cfd2',
  wallDark: '#176f7f',
  floor: '#f4da94',
  tileLine: '#d2a253',
  counter: '#e8725e',
  counterTop: '#4fb9ab',
  counterDark: '#195963',
  paper: '#fff8e8',
  cream: '#f4dfb6',
  steel: '#bfc9c1',
  steelDark: '#66736b',
  wood: '#a66535',
  rice: '#fff8d8',
  riceDry: '#d5bd79',
  chickenRaw: '#efb98b',
  chickenCooked: '#f4d6a2',
  chickenSkin: '#c07a43',
  chili: '#d83a2a',
  ginger: '#d89a3d',
  garlic: '#f7ead0',
  jade: '#2aa68e',
  blue: '#87c9d1',
  amber: '#f1bf3a',
  black: '#211813',
};

export function VoxelCanvas({ state }: { state: KitchenVisualState | null }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef<KitchenVisualState | null>(state);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

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
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.25));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setClearColor(0x000000, 0);
    host.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x49bcc7, 15, 28);
    scene.add(new THREE.HemisphereLight(0xfff1c7, 0x187286, 3.1));
    const key = new THREE.DirectionalLight(0xffffff, 2.2);
    key.position.set(2, 9, 3);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0xff8d76, 1.1);
    rim.position.set(-3, 4, -3);
    scene.add(rim);

    const camera = new THREE.OrthographicCamera(-5, 5, 5, -5, 0.1, 80);
    camera.up.set(0, 1, 0);
    camera.position.set(0, 10.8, 5.7);
    camera.lookAt(0, 0, 0);

    const root = new THREE.Group();
    root.scale.set(0.58, 1, 0.9);
    scene.add(root);
    const { dynamics, dispose } = buildKitchen(root);

    const resize = () => {
      const rect = host.getBoundingClientRect();
      const width = Math.max(1, Math.floor(rect.width));
      const height = Math.max(1, Math.floor(rect.height));
      renderer.setSize(width, height, false);
      const aspect = width / height;
      const view = 5.55;
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
    const frameMs = 1000 / 45;
    const animate = (now: number) => {
      if (!document.hidden && now - last >= frameMs) {
        last = now - ((now - last) % frameMs);
        updateDynamics(dynamics, stateRef.current, now / 1000);
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
  }, []);

  return <div ref={hostRef} className="game-canvas" aria-hidden />;
}

function buildKitchen(root: THREE.Group) {
  const geometries = {
    box: new THREE.BoxGeometry(1, 1, 1),
    cyl12: new THREE.CylinderGeometry(1, 1, 1, 12),
    cyl18: new THREE.CylinderGeometry(1, 1, 1, 18),
    puff: new THREE.DodecahedronGeometry(1, 0),
    ring: new THREE.TorusGeometry(1, 0.045, 4, 18),
  };
  const materialCache = new Map<string, THREE.MeshLambertMaterial>();

  const mat = (color: string, transparent = false, opacity = 1) => {
    const key = `${color}:${transparent}:${opacity}`;
    let found = materialCache.get(key);
    if (!found) {
      found = new THREE.MeshLambertMaterial({ color, transparent, opacity, flatShading: true });
      materialCache.set(key, found);
    }
    return found;
  };

  const cube: CubeFn = (parent, color, x, y, z, sx = 1, sy = 1, sz = 1, transparent = false, opacity = 1) => {
    const mesh = new THREE.Mesh(geometries.box, mat(color, transparent, opacity));
    mesh.position.set(x, y, z);
    mesh.scale.set(sx, sy, sz);
    parent.add(mesh);
    return mesh;
  };

  const cyl: CylFn = (parent, color, x, y, z, sx = 1, sy = 1, sz = 1, transparent = false, opacity = 1, segments = 18) => {
    const mesh = new THREE.Mesh(segments === 12 ? geometries.cyl12 : geometries.cyl18, mat(color, transparent, opacity));
    mesh.position.set(x, y, z);
    mesh.scale.set(sx, sy, sz);
    parent.add(mesh);
    return mesh;
  };

  const puff: PuffFn = (parent, color, x, y, z, scale = 1, opacity = 0.62) => {
    const group = new THREE.Group();
    group.position.set(x, y, z);
    group.userData.dynamic = true;
    parent.add(group);
    const parts = [
      { x: 0, y: 0.02, z: 0, s: 0.08 },
      { x: -0.08, y: -0.02, z: 0.03, s: 0.06 },
      { x: 0.09, y: -0.01, z: -0.02, s: 0.065 },
      { x: 0.02, y: 0.08, z: -0.04, s: 0.05 },
    ];
    for (const part of parts) {
      const mesh = new THREE.Mesh(geometries.puff, mat(color, true, opacity));
      mesh.position.set(part.x * scale, part.y * scale, part.z * scale);
      mesh.scale.setScalar(part.s * scale);
      group.add(mesh);
    }
    return group;
  };

  const ring: RingFn = (parent, color, x, y, z, sx = 1, sz = 1, transparent = false, opacity = 1) => {
    const mesh = new THREE.Mesh(geometries.ring, mat(color, transparent, opacity));
    mesh.position.set(x, y, z);
    mesh.scale.set(sx, sz, 1);
    mesh.rotation.x = Math.PI / 2;
    parent.add(mesh);
    return mesh;
  };

  makeRoom(root, cube);
  makeCounters(root, cube);
  const dynamics: DynamicRefs = {
    chef: makeChef(root, cube, cyl),
    chefBody: undefined as unknown as THREE.Mesh,
    leftArm: undefined as unknown as THREE.Mesh,
    rightArm: undefined as unknown as THREE.Mesh,
    heldItems: makeHeldItems(root, cube, cyl),
    guideArrow: makeGuideArrow(root),
    highlights: {} as Record<StationId, THREE.Mesh>,
    progressBars: {},
    fridgeDoor: makeFridge(root, cube),
    pantrySack: makePantry(root, cube),
    boardRawChicken: new THREE.Group(),
    boardCutChicken: new THREE.Group(),
    knife: new THREE.Group(),
    riceBowl: new THREE.Group(),
    riceItem: new THREE.Group(),
    riceSteam: [],
    potWater: undefined as unknown as THREE.Mesh,
    potChicken: new THREE.Group(),
    potSteam: [],
    potBubbles: [],
    mortarIngredients: new THREE.Group(),
    mortarSauce: new THREE.Group(),
    pestle: new THREE.Group(),
    plateItems: {} as Record<PlateComponent, THREE.Group>,
    bell: new THREE.Group(),
    trashLid: new THREE.Group(),
    pulseStation: null,
    pulseStart: -10,
    lastPulseKey: 0,
  };

  const chefParts = dynamics.chef.userData as { body: THREE.Mesh; leftArm: THREE.Mesh; rightArm: THREE.Mesh };
  dynamics.chefBody = chefParts.body;
  dynamics.leftArm = chefParts.leftArm;
  dynamics.rightArm = chefParts.rightArm;

  makeBoard(root, cube, cyl, dynamics);
  makeRiceCooker(root, cube, cyl, puff, dynamics);
  makePot(root, cube, cyl, puff, dynamics);
  makeMortar(root, cube, cyl, dynamics);
  makePlate(root, cube, cyl, dynamics);
  makeServe(root, cube, cyl, dynamics);
  makeTrash(root, cube, cyl, dynamics);
  makeStationHighlights(root, ring, cube, dynamics);

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
      const guideMaterial = dynamics.guideArrow.material as THREE.SpriteMaterial;
      guideMaterial.map?.dispose();
      guideMaterial.dispose();
      root.clear();
      Object.values(geometries).forEach((geometry) => geometry.dispose());
      materialCache.forEach((material) => material.dispose());
    },
  };
}

function makeRoom(root: THREE.Group, cube: CubeFn) {
  cube(root, COLORS.wallDark, 0, 1.15, -3.08, 8.4, 2.25, 0.22);
  cube(root, COLORS.wall, 0, 0.78, -3.2, 8.2, 0.34, 0.28);
  cube(root, '#257f8a', 0, 1.72, -2.94, 8.0, 0.1, 0.035);
  cube(root, '#ffd565', 0, 1.55, -2.93, 7.7, 0.055, 0.035);
  cube(root, '#f47d55', 0, 1.47, -2.92, 7.7, 0.035, 0.035);
  cube(root, '#fff0bc', -0.2, 0.92, -2.91, 6.7, 0.52, 0.035);
  for (let x = -3.25; x <= 2.9; x += 0.56) cube(root, '#e4bc62', x, 0.92, -2.885, 0.018, 0.48, 0.025, true, 0.55);
  for (let y = 0.7; y <= 1.12; y += 0.14) cube(root, '#e4bc62', -0.2, y, -2.88, 6.55, 0.014, 0.025, true, 0.55);
  for (let x = -2.95; x <= 2.8; x += 1.12) {
    cube(root, '#ffed9a', x, 1.18, -2.875, 0.12, 0.12, 0.026, true, 0.62);
    cube(root, '#34b58f', x + 0.28, 0.76, -2.875, 0.1, 0.1, 0.026, true, 0.52);
  }
  makeWallFrame(root, cube, -2.85, 1.5, '#fff6d2', '#ef8b4c');
  makeWallFrame(root, cube, 2.75, 1.5, '#e7fff4', '#2aa68e');
  for (let x = -2.5; x <= 2.5; x += 2.5) makePendantLight(root, cube, x);
  cube(root, '#102e34', 0, -0.34, -0.35, 8.55, 0.16, 4.86);
  cube(root, COLORS.floor, 0, -0.2, -0.35, 8.0, 0.14, 4.42);
  cube(root, '#fff0b9', 0, -0.09, -0.35, 7.62, 0.035, 4.05, true, 0.32);
  for (let x = -3.35; x <= 3.35; x += 0.95) cube(root, COLORS.tileLine, x, -0.07, -0.35, 0.024, 0.035, 4.0, true, 0.72);
  for (let z = -2.25; z <= 1.55; z += 0.95) cube(root, COLORS.tileLine, 0, -0.065, z, 7.54, 0.035, 0.024, true, 0.72);
}

function makeWallFrame(root: THREE.Group, cube: CubeFn, x: number, y: number, paper: string, accent: string) {
  cube(root, '#155a67', x, y, -2.865, 0.72, 0.45, 0.04);
  cube(root, paper, x, y, -2.84, 0.58, 0.32, 0.035);
  cube(root, accent, x, y + 0.09, -2.815, 0.38, 0.035, 0.02);
  cube(root, accent, x - 0.02, y - 0.02, -2.815, 0.28, 0.03, 0.02, true, 0.74);
  cube(root, '#f3ca68', x + 0.18, y - 0.11, -2.81, 0.08, 0.08, 0.02);
}

function makePendantLight(root: THREE.Group, cube: CubeFn, x: number) {
  cube(root, '#184f5a', x, 1.88, -2.66, 0.035, 0.34, 0.035);
  cube(root, '#ffe58b', x, 1.66, -2.64, 0.24, 0.14, 0.18, true, 0.84);
  cube(root, '#f08a48', x, 1.58, -2.64, 0.3, 0.045, 0.2, true, 0.72);
}

function makeCounters(root: THREE.Group, cube: CubeFn) {
  cube(root, COLORS.counterDark, -0.2, 0.02, -2.22, 6.18, 0.18, 0.68);
  cube(root, COLORS.counterTop, -0.2, 0.28, -2.22, 5.96, 0.22, 0.54);
  cube(root, COLORS.counter, -0.2, 0.43, -1.9, 6.02, 0.08, 0.08);
  cube(root, COLORS.counterDark, -0.15, 0.02, 1.55, 5.74, 0.18, 0.7);
  cube(root, COLORS.counterTop, -0.15, 0.28, 1.55, 5.52, 0.22, 0.54);
  cube(root, COLORS.counter, -0.15, 0.43, 1.23, 5.58, 0.08, 0.08);
  cube(root, COLORS.counterDark, 3.35, 0.02, 0.24, 0.62, 0.18, 2.55);
  cube(root, COLORS.counterTop, 3.35, 0.28, 0.24, 0.46, 0.22, 2.35);
  cube(root, COLORS.counter, 3.08, 0.43, 0.24, 0.08, 0.08, 2.38);
  cube(root, COLORS.counterDark, -3.38, 0.02, 0.06, 0.62, 0.18, 2.56);
  cube(root, COLORS.counterTop, -3.38, 0.28, 0.06, 0.46, 0.22, 2.36);
  cube(root, COLORS.counter, -3.1, 0.43, 0.06, 0.08, 0.08, 2.38);
  for (let x = -2.45; x <= 2.35; x += 1.2) {
    cube(root, '#f6a16f', x, 0.45, -1.87, 0.42, 0.06, 0.035);
    cube(root, '#f6a16f', x, 0.45, 1.2, 0.42, 0.06, 0.035);
  }
  cube(root, '#fff3cb', -2.35, 0.48, -2.0, 0.18, 0.06, 0.07);
  cube(root, '#fff3cb', -2.08, 0.48, -2.0, 0.12, 0.06, 0.07);
  cube(root, '#ffcf55', 2.58, 0.48, 1.2, 0.12, 0.08, 0.08);
  cube(root, '#f6a16f', 3.08, 0.45, -0.72, 0.035, 0.06, 0.42);
  cube(root, '#f6a16f', -3.1, 0.45, -0.36, 0.035, 0.06, 0.42);
}

function makeFridge(root: THREE.Group, cube: CubeFn) {
  const group = new THREE.Group();
  group.position.set(-3.18, 0.42, -1.23);
  root.add(group);
  cube(group, '#eaf5f3', 0, 0.42, 0, 0.58, 1.12, 0.48);
  cube(group, '#f8ffff', 0, 0.75, -0.255, 0.52, 0.38, 0.035);
  cube(group, '#c8d8d2', 0, -0.22, 0, 0.58, 0.18, 0.48);
  const door = new THREE.Group();
  door.userData.dynamic = true;
  group.add(door);
  cube(door, '#a9d9df', 0, 0.52, -0.27, 0.5, 0.46, 0.05);
  cube(door, '#6f9ca4', 0.2, 0.36, -0.31, 0.04, 0.38, 0.04);
  cube(door, '#e9fbff', -0.07, 0.54, -0.315, 0.04, 0.22, 0.025);
  cube(door, '#e9fbff', -0.07, 0.54, -0.315, 0.18, 0.04, 0.025);
  cube(door, '#e9fbff', -0.07, 0.54, -0.315, 0.13, 0.035, 0.025).rotation.z = 0.75;
  cube(door, '#e9fbff', -0.07, 0.54, -0.315, 0.13, 0.035, 0.025).rotation.z = -0.75;
  cube(group, '#f6fbfb', -0.16, 0.88, -0.26, 0.12, 0.12, 0.035);
  cube(group, '#ffcf55', 0.08, 0.88, -0.26, 0.1, 0.08, 0.035);
  cube(group, '#d3e2df', 0, 0.05, -0.26, 0.5, 0.035, 0.035);
  return door;
}

function makePantry(root: THREE.Group, cube: CubeFn) {
  const group = new THREE.Group();
  group.position.set(-1.6, 0.72, -2.02);
  group.userData.dynamic = true;
  root.add(group);
  cube(group, '#b26d32', 0, -0.02, 0, 0.78, 0.68, 0.36);
  cube(group, '#7a4826', 0, 0.21, -0.2, 0.72, 0.07, 0.07);
  cube(group, COLORS.rice, -0.2, 0.48, -0.16, 0.26, 0.24, 0.18);
  cube(group, '#e9d79b', -0.2, 0.63, -0.16, 0.16, 0.07, 0.12);
  cube(group, COLORS.rice, 0.05, 0.48, -0.14, 0.22, 0.2, 0.16);
  cube(group, '#e9d79b', 0.05, 0.61, -0.14, 0.13, 0.055, 0.1);
  cube(group, COLORS.ginger, 0.16, 0.46, -0.15, 0.19, 0.1, 0.14);
  cube(group, '#f7e8b8', -0.2, 0.49, -0.29, 0.13, 0.06, 0.035);
  cube(group, '#df8731', 0.24, 0.61, -0.15, 0.18, 0.18, 0.16);
  cube(group, '#fff7d1', -0.34, 0.34, -0.23, 0.08, 0.04, 0.05);
  cube(group, '#fff7d1', -0.25, 0.34, -0.23, 0.06, 0.035, 0.05);
  cube(group, '#f4dfb6', 0.33, 0.43, -0.18, 0.04, 0.26, 0.04).rotation.z = -0.65;
  return group;
}

function makeBoard(root: THREE.Group, cube: CubeFn, cyl: CylFn, d: DynamicRefs) {
  const board = new THREE.Group();
  board.position.set(0.05, 0.6, -2.0);
  root.add(board);
  cube(board, '#b36b36', 0, 0, 0, 0.96, 0.12, 0.52);
  cube(board, '#f2cf91', 0, 0.09, 0, 0.74, 0.07, 0.36);
  cube(board, '#d8914f', -0.22, 0.15, 0, 0.035, 0.025, 0.28);
  cube(board, '#d8914f', 0.22, 0.15, 0, 0.035, 0.025, 0.28);
  cube(board, '#fff1bf', 0, 0.16, -0.16, 0.48, 0.018, 0.025);
  cube(board, '#fff1bf', 0, 0.16, 0.16, 0.48, 0.018, 0.025);
  cube(board, '#7a4826', -0.42, 0.12, 0, 0.08, 0.035, 0.12);

  d.boardRawChicken = new THREE.Group();
  d.boardRawChicken.userData.dynamic = true;
  d.boardRawChicken.position.set(0.05, 0.78, -2.0);
  root.add(d.boardRawChicken);
  addChickenShape(d.boardRawChicken, cube, cyl, false, 1.05);

  d.boardCutChicken = new THREE.Group();
  d.boardCutChicken.userData.dynamic = true;
  d.boardCutChicken.position.set(0.05, 0.78, -2.0);
  root.add(d.boardCutChicken);
  for (let i = 0; i < 4; i += 1) {
    const piece = cyl(d.boardCutChicken, COLORS.chickenRaw, -0.24 + i * 0.16, 0.02, (i % 2) * 0.08 - 0.04, 0.08, 0.055, 0.11, false, 1, 12);
    piece.rotation.z = i % 2 ? 0.35 : -0.22;
    cyl(d.boardCutChicken, COLORS.chickenSkin, -0.24 + i * 0.16, 0.08, (i % 2) * 0.08 - 0.1, 0.065, 0.018, 0.03, false, 1, 12);
  }

  d.knife = new THREE.Group();
  d.knife.userData.dynamic = true;
  d.knife.position.set(0.37, 0.9, -2.0);
  root.add(d.knife);
  cube(d.knife, COLORS.steel, -0.08, 0, 0, 0.52, 0.05, 0.12);
  cube(d.knife, '#e9f0ec', -0.26, 0.035, -0.055, 0.22, 0.025, 0.025);
  cube(d.knife, COLORS.black, 0.25, -0.02, 0, 0.28, 0.07, 0.1);
}

function makeRiceCooker(root: THREE.Group, cube: CubeFn, cyl: CylFn, puff: PuffFn, d: DynamicRefs) {
  const group = new THREE.Group();
  group.position.set(1.75, 0.63, -2.0);
  group.userData.dynamic = true;
  root.add(group);
  cube(group, '#173b41', 0, -0.1, 0, 0.92, 0.2, 0.62);
  cyl(group, COLORS.steelDark, 0, 0.07, 0, 0.46, 0.18, 0.32);
  cyl(group, '#f8fffa', 0, 0.25, 0, 0.38, 0.075, 0.25);
  cyl(group, '#263135', 0, 0.31, 0, 0.22, 0.04, 0.15);
  cyl(group, '#d7e5df', 0, 0.37, -0.03, 0.07, 0.035, 0.05);
  cube(group, '#e7f3ef', 0, 0.22, 0.33, 0.34, 0.08, 0.035);
  cube(group, '#ffcf55', -0.12, 0.28, 0.35, 0.055, 0.035, 0.035);
  cube(group, '#57c3ad', 0.11, 0.28, 0.35, 0.055, 0.035, 0.035);
  const paddle = cube(group, '#fff2c4', 0.46, 0.24, -0.02, 0.055, 0.42, 0.06);
  paddle.rotation.z = -0.35;
  cube(group, '#fff2c4', 0.36, 0.08, -0.05, 0.12, 0.08, 0.08);
  d.riceBowl = group;
  d.riceItem = new THREE.Group();
  d.riceItem.userData.dynamic = true;
  d.riceItem.position.set(1.75, 0.96, -2.0);
  root.add(d.riceItem);
  cyl(d.riceItem, COLORS.rice, 0, 0, 0, 0.34, 0.07, 0.24);
  cube(d.riceItem, '#fffdf1', -0.12, 0.08, 0.02, 0.07, 0.04, 0.06);
  cube(d.riceItem, '#fffdf1', 0.13, 0.08, -0.02, 0.07, 0.04, 0.06);
  for (let i = 0; i < 4; i += 1) {
    const steam = puff(root, COLORS.paper, 1.5 + i * 0.16, 1.16, -2.08, 0.9, 0.48);
    d.riceSteam.push(steam);
  }
  d.progressBars.riceCooker = makeProgress(root, cube, 1.75, -2.0);
}

function makePot(root: THREE.Group, cube: CubeFn, cyl: CylFn, puff: PuffFn, d: DynamicRefs) {
  const group = new THREE.Group();
  const station = STATION_BY_ID.pot;
  group.position.set(station.x, 0.58, station.z);
  root.add(group);
  cube(group, '#173b41', 0, -0.12, 0, 0.96, 0.2, 0.7);
  cube(group, '#ef6a3e', 0, -0.02, 0.34, 0.34, 0.08, 0.06);
  cube(group, '#ffd65b', 0, 0.03, 0.36, 0.2, 0.06, 0.045);
  cyl(group, COLORS.steelDark, 0, 0.1, 0, 0.5, 0.26, 0.36);
  cyl(group, COLORS.steel, 0, 0.29, 0, 0.43, 0.1, 0.29);
  cube(group, COLORS.steelDark, -0.56, 0.2, 0, 0.16, 0.08, 0.12);
  cube(group, COLORS.steelDark, 0.56, 0.2, 0, 0.16, 0.08, 0.12);
  d.potWater = cyl(group, COLORS.blue, 0, 0.39, 0, 0.43, 0.035, 0.29, true, 0.74);
  d.potWater.userData.dynamic = true;
  cyl(group, '#c2f3f5', -0.11, 0.42, -0.04, 0.2, 0.012, 0.08, true, 0.58, 12);
  cyl(group, '#e1ffff', 0.16, 0.43, 0.08, 0.12, 0.01, 0.06, true, 0.48, 12);

  d.potChicken = new THREE.Group();
  d.potChicken.userData.dynamic = true;
  d.potChicken.position.set(station.x, 1.03, station.z);
  root.add(d.potChicken);
  addChickenShape(d.potChicken, cube, cyl, true, 1);

  for (let i = 0; i < 5; i += 1) {
    const steam = puff(root, COLORS.paper, station.x - 0.28 + i * 0.13, 1.1, station.z - 0.13, 1, 0.5);
    d.potSteam.push(steam);
  }
  for (let i = 0; i < 5; i += 1) {
    const bubble = cyl(group, COLORS.paper, -0.25 + i * 0.12, 0.45, -0.08 + (i % 2) * 0.12, 0.035, 0.012, 0.035, true, 0.6, 12);
    bubble.userData.dynamic = true;
    bubble.userData.baseScale = { x: 0.035, y: 0.012, z: 0.035 };
    d.potBubbles.push(bubble);
  }
  d.progressBars.pot = makeProgress(root, cube, station.x, station.z);
}

function makeMortar(root: THREE.Group, cube: CubeFn, cyl: CylFn, d: DynamicRefs) {
  const base = new THREE.Group();
  const station = STATION_BY_ID.mortar;
  base.position.set(station.x, 0.64, station.z);
  root.add(base);
  cyl(base, '#25363a', 0, -0.08, 0, 0.46, 0.14, 0.34);
  cyl(base, '#81746b', 0, 0.09, 0, 0.36, 0.22, 0.26);
  cyl(base, '#302924', 0, 0.25, 0, 0.22, 0.07, 0.17);
  cube(base, '#9f9287', -0.26, 0.02, 0, 0.08, 0.08, 0.12);
  cube(base, '#9f9287', 0.26, 0.02, 0, 0.08, 0.08, 0.12);
  cube(base, '#f7ead0', -0.43, 0.2, -0.16, 0.1, 0.08, 0.09);
  cube(base, '#f7ead0', -0.34, 0.22, -0.12, 0.08, 0.07, 0.08);
  const sideChili = cyl(base, COLORS.chili, 0.42, 0.21, -0.1, 0.07, 0.18, 0.06, false, 1, 12);
  sideChili.rotation.z = 1.05;
  cube(base, '#2ea05a', 0.36, 0.28, -0.16, 0.08, 0.035, 0.035);
  cube(base, COLORS.ginger, 0.32, 0.19, 0.16, 0.18, 0.08, 0.1);

  d.mortarIngredients = new THREE.Group();
  d.mortarIngredients.userData.dynamic = true;
  d.mortarIngredients.position.set(station.x, 0.98, station.z);
  root.add(d.mortarIngredients);
  const chiliA = cyl(d.mortarIngredients, COLORS.chili, -0.12, 0, 0, 0.08, 0.16, 0.06, false, 1, 12);
  chiliA.rotation.z = 1.2;
  const chiliB = cyl(d.mortarIngredients, COLORS.chili, -0.03, 0.01, 0.08, 0.07, 0.13, 0.05, false, 1, 12);
  chiliB.rotation.z = 0.65;
  cyl(d.mortarIngredients, COLORS.ginger, 0.1, 0.02, 0.06, 0.1, 0.04, 0.08);
  cube(d.mortarIngredients, COLORS.garlic, 0, 0.05, -0.1, 0.11, 0.07, 0.09);
  cube(d.mortarIngredients, '#2ea05a', -0.04, 0.05, 0.11, 0.12, 0.025, 0.04);

  d.mortarSauce = new THREE.Group();
  d.mortarSauce.userData.dynamic = true;
  d.mortarSauce.position.set(station.x, 0.99, station.z);
  root.add(d.mortarSauce);
  cyl(d.mortarSauce, COLORS.chili, 0, 0, 0, 0.2, 0.045, 0.15, true, 0.92);

  d.pestle = new THREE.Group();
  d.pestle.userData.dynamic = true;
  d.pestle.position.set(station.x + 0.35, 1.2, station.z - 0.02);
  root.add(d.pestle);
  const pestleMesh = cube(d.pestle, COLORS.cream, 0, 0, 0, 0.14, 0.85, 0.14);
  pestleMesh.rotation.z = -0.58;
  d.progressBars.mortar = makeProgress(root, cube, station.x, station.z);
}

function makePlate(root: THREE.Group, cube: CubeFn, cyl: CylFn, d: DynamicRefs) {
  const plateBase = new THREE.Group();
  const station = STATION_BY_ID.plate;
  plateBase.position.set(station.x, 0.66, station.z);
  root.add(plateBase);
  cyl(plateBase, '#2a2020', 0, -0.08, 0, 0.62, 0.09, 0.43);
  cyl(plateBase, COLORS.paper, 0, 0, 0, 0.52, 0.06, 0.35);
  cyl(plateBase, '#e7dccd', 0, 0.04, 0, 0.4, 0.018, 0.26, true, 0.5);
  cyl(plateBase, '#fffdf6', -0.14, 0.066, -0.08, 0.09, 0.006, 0.035, true, 0.55);
  cyl(plateBase, '#f4eee3', 0.18, 0.065, 0.1, 0.07, 0.006, 0.028, true, 0.45);

  const rice = new THREE.Group();
  rice.userData.dynamic = true;
  rice.position.set(station.x, 0.76, station.z);
  root.add(rice);
  cyl(rice, COLORS.rice, -0.18, 0.02, 0, 0.24, 0.1, 0.18);
  cube(rice, '#fffdf1', -0.08, 0.12, 0.02, 0.06, 0.04, 0.06);
  cube(rice, '#fffdf1', -0.24, 0.11, -0.04, 0.05, 0.035, 0.04);

  const chicken = new THREE.Group();
  chicken.userData.dynamic = true;
  chicken.position.set(station.x, 0.78, station.z);
  root.add(chicken);
  for (let i = 0; i < 4; i += 1) {
    const slice = cyl(chicken, COLORS.chickenCooked, -0.04 + i * 0.1, 0.04, -0.04, 0.055, 0.04, 0.13, false, 1, 12);
    slice.rotation.z = -0.2;
    cyl(chicken, COLORS.chickenSkin, -0.04 + i * 0.1, 0.1, -0.14, 0.052, 0.018, 0.032, false, 1, 12);
  }

  const sauce = new THREE.Group();
  sauce.userData.dynamic = true;
  sauce.position.set(station.x, 0.78, station.z);
  root.add(sauce);
  cyl(sauce, COLORS.chili, 0.34, 0.04, 0.14, 0.1, 0.045, 0.08);

  d.plateItems = { rice, chicken, sauce };
}

function makeServe(root: THREE.Group, cube: CubeFn, cyl: CylFn, d: DynamicRefs) {
  const group = new THREE.Group();
  const station = STATION_BY_ID.serve;
  group.position.set(station.x, 0.8, station.z);
  root.add(group);
  cube(group, '#173b41', 0, -0.13, 0, 0.94, 0.16, 0.64);
  cube(group, '#efc27d', 0, 0.04, 0, 0.78, 0.11, 0.46);
  cube(group, COLORS.wallDark, 0, 0.46, 0.28, 0.88, 0.56, 0.07);
  cube(group, '#fff3cb', 0, 0.4, 0.22, 0.62, 0.18, 0.04);
  cube(group, '#39c4d3', 0, 0.76, 0.18, 0.9, 0.1, 0.08);
  cube(group, '#ffd65b', -0.24, 0.83, 0.16, 0.18, 0.12, 0.07);
  cube(group, '#ff7f3f', 0, 0.83, 0.16, 0.18, 0.12, 0.07);
  cube(group, '#ffd65b', 0.24, 0.83, 0.16, 0.18, 0.12, 0.07);
  cube(group, '#e8725e', -0.34, 0.56, 0.2, 0.12, 0.32, 0.05);
  cube(group, '#e8725e', 0.34, 0.56, 0.2, 0.12, 0.32, 0.05);
  cube(group, '#fff8e8', -0.24, 0.16, -0.24, 0.26, 0.035, 0.18);
  cube(group, '#efb98b', 0.08, 0.17, -0.22, 0.18, 0.035, 0.13);
  d.bell = new THREE.Group();
  d.bell.userData.dynamic = true;
  d.bell.position.set(station.x, 1.0, station.z - 0.17);
  root.add(d.bell);
  cyl(d.bell, COLORS.amber, 0, 0, 0, 0.16, 0.1, 0.16);
  cyl(d.bell, '#fff1a3', 0, 0.12, 0, 0.05, 0.035, 0.05);
}

function makeTrash(root: THREE.Group, cube: CubeFn, cyl: CylFn, d: DynamicRefs) {
  const group = new THREE.Group();
  group.position.set(-3.3, 0.58, 0.65);
  root.add(group);
  cyl(group, '#34302b', 0, 0, 0, 0.28, 0.48, 0.28);
  cyl(group, '#555047', 0, 0.28, 0, 0.32, 0.07, 0.32);
  cube(group, '#8d887b', 0, -0.28, -0.28, 0.26, 0.04, 0.08);
  d.trashLid = new THREE.Group();
  d.trashLid.userData.dynamic = true;
  d.trashLid.position.set(-3.3, 0.86, 0.65);
  root.add(d.trashLid);
  cube(d.trashLid, '#71695e', 0, 0, 0, 0.56, 0.07, 0.38);
}

function makeGuideArrow(root: THREE.Group) {
  const canvas = document.createElement('canvas');
  canvas.width = 96;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const fill = ctx.createLinearGradient(0, 18, 0, 104);
    fill.addColorStop(0, '#fff06a');
    fill.addColorStop(0.42, '#ffb244');
    fill.addColorStop(1, '#f05a2a');

    ctx.shadowColor = 'rgba(33, 24, 19, 0.38)';
    ctx.shadowBlur = 14;
    ctx.shadowOffsetY = 8;
    ctx.beginPath();
    ctx.moveTo(42, 12);
    ctx.quadraticCurveTo(42, 6, 48, 6);
    ctx.quadraticCurveTo(54, 6, 54, 12);
    ctx.lineTo(54, 48);
    ctx.lineTo(76, 48);
    ctx.quadraticCurveTo(84, 48, 79, 56);
    ctx.lineTo(51, 102);
    ctx.quadraticCurveTo(48, 108, 45, 102);
    ctx.lineTo(17, 56);
    ctx.quadraticCurveTo(12, 48, 20, 48);
    ctx.lineTo(42, 48);
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();

    ctx.shadowColor = 'transparent';
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.lineWidth = 7;
    ctx.strokeStyle = '#fff7d1';
    ctx.stroke();

    ctx.globalAlpha = 0.72;
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#fffbdc';
    ctx.beginPath();
    ctx.moveTo(48, 17);
    ctx.lineTo(48, 50);
    ctx.moveTo(31, 58);
    ctx.lineTo(48, 85);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.LinearFilter;
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: false,
    depthWrite: false,
  });
  const sprite = new THREE.Sprite(material);
  sprite.userData.dynamic = true;
  sprite.visible = false;
  sprite.renderOrder = 10;
  root.add(sprite);
  return sprite;
}

function addChickenShape(parent: THREE.Group, cube: CubeFn, cyl: CylFn, cooked: boolean, scale = 1) {
  const meat = cooked ? COLORS.chickenCooked : COLORS.chickenRaw;
  const skin = cooked ? COLORS.chickenSkin : '#d78a55';
  const bone = cooked ? '#fff4d8' : COLORS.garlic;
  cyl(parent, meat, 0, 0, 0, 0.3 * scale, 0.13 * scale, 0.21 * scale);
  cyl(parent, skin, 0.02 * scale, 0.08 * scale, -0.17 * scale, 0.24 * scale, 0.025 * scale, 0.034 * scale, false, 1, 12);
  cyl(parent, cooked ? '#f8e5bd' : '#f5c79a', -0.1 * scale, 0.08 * scale, -0.08 * scale, 0.08 * scale, 0.018 * scale, 0.028 * scale, false, 1, 12);

  const leftLeg = cyl(parent, meat, -0.24 * scale, 0.01 * scale, 0.08 * scale, 0.07 * scale, 0.16 * scale, 0.075 * scale, false, 1, 12);
  leftLeg.rotation.z = 1.0;
  const rightLeg = cyl(parent, meat, 0.24 * scale, 0.01 * scale, 0.08 * scale, 0.07 * scale, 0.16 * scale, 0.075 * scale, false, 1, 12);
  rightLeg.rotation.z = -1.0;
  cyl(parent, bone, -0.37 * scale, 0.06 * scale, 0.09 * scale, 0.045 * scale, 0.035 * scale, 0.045 * scale, false, 1, 12);
  cyl(parent, bone, 0.37 * scale, 0.06 * scale, 0.09 * scale, 0.045 * scale, 0.035 * scale, 0.045 * scale, false, 1, 12);

  const wingA = cyl(parent, skin, -0.2 * scale, 0 * scale, -0.08 * scale, 0.065 * scale, 0.12 * scale, 0.08 * scale, false, 1, 12);
  wingA.rotation.z = -0.85;
  const wingB = cyl(parent, skin, 0.2 * scale, 0 * scale, -0.08 * scale, 0.065 * scale, 0.12 * scale, 0.08 * scale, false, 1, 12);
  wingB.rotation.z = 0.85;
  cube(parent, cooked ? '#dba36d' : '#e6a16f', 0, 0.075 * scale, 0.16 * scale, 0.16 * scale, 0.025 * scale, 0.035 * scale);
}

function makeStationHighlights(root: THREE.Group, ring: RingFn, cube: CubeFn, d: DynamicRefs) {
  for (const station of STATIONS) {
    const target = ring(root, COLORS.jade, station.x, 0.08, station.z, 0.42, 0.42, true, 0.16);
    target.userData.dynamic = true;
    target.userData.baseScale = { x: 0.42, y: 0.42, z: 1 };
    d.highlights[station.id] = target;
    d.progressBars[station.id] ??= makeProgress(root, cube, station.x, station.z);
  }
}

function makeProgress(root: THREE.Group, cube: CubeFn, x: number, z: number) {
  cube(root, COLORS.black, x, 1.34, z - 0.42, 0.64, 0.06, 0.05, true, 0);
  const fill = cube(root, COLORS.jade, x - 0.31, 1.39, z - 0.42, 0.02, 0.08, 0.07);
  fill.userData.dynamic = true;
  fill.userData.originX = x - 0.31;
  return fill;
}

function makeChef(root: THREE.Group, cube: CubeFn, cyl: CylFn) {
  const group = new THREE.Group();
  group.userData.dynamic = true;
  root.add(group);
  const body = cube(group, '#ef5a3f', 0, 0.46, 0, 0.38, 0.5, 0.3);
  const apron = cube(group, COLORS.paper, 0, 0.48, -0.16, 0.27, 0.38, 0.05);
  const head = cyl(group, '#efbf8a', 0, 0.9, 0, 0.22, 0.22, 0.22);
  const hat = cyl(group, COLORS.paper, 0, 1.13, 0, 0.28, 0.17, 0.28);
  const hatTop = cube(group, COLORS.paper, 0, 1.27, 0, 0.42, 0.12, 0.34);
  const leftArm = cube(group, '#efbf8a', -0.3, 0.53, -0.02, 0.12, 0.34, 0.12);
  const rightArm = cube(group, '#efbf8a', 0.3, 0.53, -0.02, 0.12, 0.34, 0.12);
  [body, apron, head, hat, hatTop, leftArm, rightArm].forEach((mesh) => {
    mesh.userData.dynamic = true;
  });
  group.userData = { body, leftArm, rightArm };
  return group;
}

function makeHeldItems(root: THREE.Group, cube: CubeFn, cyl: CylFn) {
  const groups = {} as Record<HeldItem, THREE.Group>;
  const item = (id: HeldItem) => {
    const group = new THREE.Group();
    group.userData.dynamic = true;
    group.visible = false;
    root.add(group);
    groups[id] = group;
    return group;
  };

  cyl(item('rawRice'), COLORS.rice, 0, 0, 0, 0.22, 0.1, 0.18);
  cyl(item('cookedRice'), COLORS.rice, 0, 0, 0, 0.28, 0.12, 0.2);
  const rawChicken = item('rawChicken');
  addChickenShape(rawChicken, cube, cyl, false, 0.72);
  const cutChicken = item('cutChicken');
  cyl(cutChicken, COLORS.chickenRaw, -0.08, 0, 0, 0.08, 0.055, 0.12, false, 1, 12).rotation.z = -0.35;
  cyl(cutChicken, COLORS.chickenRaw, 0.1, 0.02, 0.04, 0.08, 0.055, 0.12, false, 1, 12).rotation.z = 0.28;
  addChickenShape(item('poachedChicken'), cube, cyl, true, 0.72);
  cyl(item('chiliSauce'), COLORS.chili, 0, 0, 0, 0.2, 0.09, 0.15);
  const dish = item('chickenRice');
  cyl(dish, COLORS.paper, 0, -0.05, 0, 0.38, 0.06, 0.26);
  cyl(dish, COLORS.rice, -0.13, 0.02, 0, 0.18, 0.08, 0.13);
  for (let i = 0; i < 3; i += 1) cyl(dish, COLORS.chickenCooked, 0.02 + i * 0.08, 0.05, -0.04, 0.045, 0.035, 0.1, false, 1, 12);
  cyl(dish, COLORS.chili, 0.23, 0.05, 0.11, 0.08, 0.045, 0.06);
  return groups;
}

function updateDynamics(d: DynamicRefs, state: KitchenVisualState | null, t: number) {
  const live = state ?? menuState();
  if (live.pulseKey && live.pulseKey !== d.lastPulseKey) {
    d.lastPulseKey = live.pulseKey;
    d.pulseStation = live.pulseStation;
    d.pulseStart = t;
  }
  const pulse = (station: StationId) => {
    const age = d.pulseStation === station ? t - d.pulseStart : 99;
    return age >= 0 && age < 0.55 ? 1 - age / 0.55 : 0;
  };
  const stationMotion = (station: StationId) => Math.max(live.activeStation === station ? 1 : 0, pulse(station));

  const target = live.targetStation && !live.served ? STATION_BY_ID[live.targetStation] : null;
  d.guideArrow.visible = Boolean(target);
  if (target) {
    const bob = Math.sin(t * 5.5) * 0.08;
    d.guideArrow.position.set(target.x, 1.78 + bob, target.z);
    const scale = 1 + Math.sin(t * 5.5) * 0.05;
    d.guideArrow.scale.set(0.54 * scale, 0.72 * scale, 1);
  }

  d.chef.position.set(live.player.x, live.player.moving ? Math.abs(Math.sin(t * 11)) * 0.035 : 0, live.player.z);
  d.chef.rotation.y = live.player.facing;
  d.leftArm.rotation.x = Math.sin(t * 10) * (live.player.moving ? 0.55 : 0.1);
  d.rightArm.rotation.x = -Math.sin(t * 10) * (live.player.moving ? 0.55 : 0.1);

  Object.entries(d.heldItems).forEach(([id, group]) => {
    const workingOnBoard = id === 'rawChicken' && live.activeStation === 'board';
    group.visible = live.held === id && !workingOnBoard;
    if (group.visible) {
      const hx = live.player.x + Math.sin(live.player.facing) * 0.38;
      const hz = live.player.z + Math.cos(live.player.facing) * 0.38;
      group.position.set(hx, 0.9 + Math.sin(t * 8) * 0.025, hz);
      group.rotation.y = live.player.facing + Math.sin(t * 3) * 0.08;
    }
  });

  for (const station of STATIONS) {
    const highlight = d.highlights[station.id];
    const near = live.nearStation === station.id;
    const active = live.activeStation === station.id;
    const targeted = live.targetStation === station.id && !live.served;
    highlight.visible = near || active || targeted;
    const scale = near || targeted ? 1.18 + Math.sin(t * 6) * 0.035 : 1.0;
    const baseScale = highlight.userData.baseScale as { x: number; y: number; z: number };
    highlight.scale.set(baseScale.x * scale, baseScale.y * scale, baseScale.z * scale);
    const material = highlight.material as THREE.MeshLambertMaterial;
    material.opacity = active ? 0.48 : near ? 0.34 : targeted ? 0.25 : 0.15;

    const progress = d.progressBars[station.id];
    if (progress) {
      const stationProgress = active ? live.activeProgress : live.stations[station.id]?.progress ?? 0;
      const show = stationProgress > 0.02 && stationProgress < 1.01;
      progress.visible = show;
      progress.scale.x = Math.max(0.02, stationProgress * 0.62);
      progress.position.x = (progress.userData.originX as number) + progress.scale.x / 2;
    }
  }

  const fridgePulse = Math.max(pulse('fridge'), live.nearStation === 'fridge' ? 0.28 : 0);
  d.fridgeDoor.rotation.y = -0.42 * fridgePulse;
  d.fridgeDoor.position.x = -0.04 * fridgePulse;

  const pantryPulse = Math.max(pulse('pantry'), live.nearStation === 'pantry' ? 0.25 : 0);
  d.pantrySack.position.y = 0.72 + Math.abs(Math.sin(t * 12)) * 0.06 * pantryPulse;
  d.pantrySack.rotation.z = Math.sin(t * 12) * 0.08 * pantryPulse;

  const boardItem = live.stations.board?.item;
  const boardWorking = live.activeStation === 'board' && live.held === 'rawChicken';
  d.boardRawChicken.visible = boardItem === 'rawChicken' || boardWorking;
  d.boardCutChicken.visible = boardItem === 'cutChicken';
  const chop = stationMotion('board');
  d.knife.position.set(0.37, 0.9 + Math.abs(Math.sin(t * 18)) * 0.26 * chop, -2.0);
  d.knife.rotation.z = -0.08 - Math.abs(Math.sin(t * 18)) * 0.5 * chop;
  d.boardRawChicken.rotation.y = Math.sin(t * 12) * 0.08 * chop;

  const riceItem = live.stations.riceCooker?.item;
  const riceActive = riceItem === 'cookingRice';
  d.riceBowl.position.set(1.75 + Math.sin(t * 14) * 0.035 * (riceActive ? 1 : 0), 0.63, -2.0);
  d.riceBowl.rotation.z = Math.sin(t * 12) * 0.07 * (riceActive ? 1 : 0);
  d.riceItem.visible = Boolean(riceItem);
  d.riceItem.position.set(1.75 + Math.sin(t * 14) * 0.06 * (riceActive ? 1 : 0), 0.96 + Math.abs(Math.sin(t * 12)) * 0.06 * (riceActive ? 1 : 0), -2.0);
  d.riceItem.rotation.y = Math.sin(t * 12) * 0.18 * (riceActive ? 1 : 0);
  d.riceSteam.forEach((steam, index) => {
    const rise = (t * 0.7 + index * 0.19) % 1;
    steam.visible = Boolean(riceItem);
    steam.position.set(1.5 + index * 0.16 + Math.sin(t + index) * 0.03, 1.05 + rise * 0.52, -2.08);
    steam.scale.setScalar(0.64 + rise * 0.32);
  });

  const potItem = live.stations.pot?.item;
  const poaching = potItem === 'poachingChicken';
  d.potWater.scale.set(0.43 + Math.sin(t * 8) * 0.02, 0.035, 0.29 + Math.cos(t * 7) * 0.018);
  d.potChicken.visible = Boolean(potItem);
  d.potChicken.position.set(STATION_BY_ID.pot.x, 1.03 + Math.sin(t * 5) * 0.035 * (poaching ? 1 : 0.35), STATION_BY_ID.pot.z);
  d.potChicken.rotation.z = Math.sin(t * 6) * 0.08 * (poaching ? 1 : 0);
  d.potSteam.forEach((steam, index) => {
    const rise = (t * 0.75 + index * 0.17) % 1;
    steam.visible = Boolean(potItem);
    steam.position.set(STATION_BY_ID.pot.x - 0.28 + index * 0.13 + Math.sin(t + index) * 0.035, 1.03 + rise * 0.62, STATION_BY_ID.pot.z - 0.13);
    steam.scale.setScalar(0.62 + rise * 0.34);
  });
  d.potBubbles.forEach((bubble, index) => {
    bubble.visible = poaching;
    bubble.position.y = 0.42 + Math.abs(Math.sin(t * 7 + index)) * 0.08;
    const baseScale = bubble.userData.baseScale as { x: number; y: number; z: number };
    const scale = 0.85 + Math.sin(t * 8 + index) * 0.18;
    bubble.scale.set(baseScale.x * scale, baseScale.y * scale, baseScale.z * scale);
  });

  const mortarItem = live.stations.mortar?.item;
  const pound = stationMotion('mortar');
  const mortarWorking = live.activeStation === 'mortar' && !live.held && !live.plate.sauce;
  d.mortarIngredients.visible = mortarItem === 'chiliIngredients' || mortarWorking;
  d.mortarSauce.visible = mortarItem === 'chiliSauce';
  d.mortarIngredients.rotation.y = Math.sin(t * 10) * 0.12 * pound;
  d.pestle.position.set(
    STATION_BY_ID.mortar.x + 0.35 - Math.abs(Math.sin(t * 16)) * 0.18 * pound,
    1.2 - Math.abs(Math.sin(t * 16)) * 0.26 * pound,
    STATION_BY_ID.mortar.z - 0.02,
  );
  d.pestle.rotation.z = -Math.abs(Math.sin(t * 16)) * 0.18 * pound;

  const platePulse = stationMotion('plate');
  Object.entries(d.plateItems).forEach(([id, group]) => {
    group.visible = live.plate[id as PlateComponent] || live.served;
    group.position.y = 0.78 + Math.sin(t * 4) * 0.006;
    group.scale.setScalar(1 + platePulse * 0.12 * Math.abs(Math.sin(t * 12)));
  });

  const bell = Math.max(stationMotion('serve'), live.served ? Math.abs(Math.sin(t * 8)) * 0.35 : 0);
  d.bell.position.set(STATION_BY_ID.serve.x, 1.0 + bell * 0.14, STATION_BY_ID.serve.z - 0.17);
  d.bell.rotation.z = Math.sin(t * 18) * 0.12 * bell;

  const trashPulse = Math.max(stationMotion('trash'), live.nearStation === 'trash' ? 0.22 : 0);
  d.trashLid.position.set(-3.3, 0.95 + trashPulse * 0.08, 0.65 - trashPulse * 0.08);
  d.trashLid.rotation.x = -trashPulse * 0.45;
}

function menuState(): KitchenVisualState {
  return {
    player: { x: 0, z: 0.1, facing: Math.PI, moving: false },
    held: null,
    stations: Object.fromEntries(STATIONS.map((station) => [station.id, { item: null, progress: 0, overcooked: false }])) as Record<StationId, VisualStationState>,
    plate: { rice: true, chicken: true, sauce: true },
    nearStation: null,
    targetStation: null,
    activeStation: null,
    activeProgress: 0,
    pulseStation: null,
    pulseKey: 0,
    served: false,
  };
}

type CubeFn = (
  parent: THREE.Object3D,
  color: string,
  x: number,
  y: number,
  z: number,
  sx?: number,
  sy?: number,
  sz?: number,
  transparent?: boolean,
  opacity?: number,
) => THREE.Mesh;

type CylFn = (
  parent: THREE.Object3D,
  color: string,
  x: number,
  y: number,
  z: number,
  sx?: number,
  sy?: number,
  sz?: number,
  transparent?: boolean,
  opacity?: number,
  segments?: number,
) => THREE.Mesh;

type PuffFn = (
  parent: THREE.Object3D,
  color: string,
  x: number,
  y: number,
  z: number,
  scale?: number,
  opacity?: number,
) => THREE.Group;

type RingFn = (
  parent: THREE.Object3D,
  color: string,
  x: number,
  y: number,
  z: number,
  sx?: number,
  sz?: number,
  transparent?: boolean,
  opacity?: number,
) => THREE.Mesh;
