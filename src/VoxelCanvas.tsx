import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import type { Body, World } from 'cannon-es';
import type { DishId } from './gameData';

type Mode = 'menu' | 'cook' | 'result';
type CannonRuntime = typeof import('cannon-es');

interface VoxelCanvasProps {
  mode: Mode;
  dishId?: DishId;
  stepId?: string;
  dim?: boolean;
  visualState?: VisualState;
}

export interface VisualState {
  sliderValue?: number;
  temp?: number;
  inZone?: boolean;
  holdPct?: number;
  stagePulse?: number;
  stageAt?: number;
  stageX?: number;
  stageY?: number;
  poachFlipCount?: number;
  cutKnifeX?: number;
  cutIndex?: number;
  cutIds?: string[];
  cutScore?: number;
  lastCutId?: string;
  sequenceIndex?: number;
  placedIds?: string[];
  dragId?: string | null;
  stirProgress?: number;
  panFlipCount?: number;
  holdProgress?: number;
  swipeProgress?: number;
  swipeDrag?: number;
  swipeDirection?: 'left' | 'right' | 'short';
  foldedCorners?: boolean[];
  platePlaced?: string[];
}

interface DynamicMeshes {
  poachMercury?: THREE.Mesh;
  poachHandle?: THREE.Mesh;
  poachSteam?: THREE.Mesh[];
  poachChicken?: THREE.Mesh[];
  cutKnife?: THREE.Mesh[];
  cutJoints?: THREE.Mesh[];
  cutChickenBody?: THREE.Mesh[];
  cutChickenParts?: Record<string, THREE.Mesh[]>;
  ingredients?: Record<string, THREE.Mesh[]>;
  sizzle?: THREE.Mesh[];
  stirSpoon?: THREE.Mesh;
  stirFood?: THREE.Mesh[];
  noodleBasket?: THREE.Mesh;
  dough?: THREE.Mesh;
  foldCorners?: THREE.Mesh[];
  plateParts?: Record<string, THREE.Mesh[]>;
  physics?: PhysicsController;
}

interface PhysicsActor {
  id: string;
  parts: THREE.Mesh[];
  body?: Body;
  origin: THREE.Vector3;
  offsets: THREE.Vector3[];
  halfExtents: THREE.Vector3;
  spawnLift: number;
  impulse: THREE.Vector3;
}

interface PhysicsController {
  CANNON: CannonRuntime;
  world: World;
  actors: Record<string, PhysicsActor>;
  lastPulse?: number;
  free: () => void;
}

const C = {
  ink: '#211817',
  floorA: '#F5D99C',
  floorB: '#E9BC78',
  cream: '#FFF4CF',
  teal: '#2BA59D',
  tealDark: '#174F55',
  red: '#D8432B',
  redDark: '#8F281C',
  yellow: '#E8B83A',
  green: '#65AA52',
  blue: '#62A8DE',
  broth: '#9FCDBF',
  steel: '#8FA1A6',
  rice: '#FAF3DA',
  chicken: '#E4AE72',
  chickenLight: '#F5D39A',
  chickenDark: '#AF7044',
  bone: '#FFF3D8',
  soup: '#C9522C',
  noodle: '#F0D15E',
  prata: '#D9903D',
  prataLight: '#F2C36B',
  curry: '#AD5421',
  shadow: '#5B3B28',
};

const accent: Record<DishId, string> = {
  'chicken-rice': C.teal,
  laksa: C.red,
  prata: C.yellow,
};

export function VoxelCanvas({ mode, dishId = 'chicken-rice', stepId, dim = false, visualState = {} }: VoxelCanvasProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const visualRef = useRef<VisualState>(visualState);

  useEffect(() => {
    visualRef.current = visualState;
  }, [visualState]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return undefined;

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: false,
      powerPreference: 'default',
      precision: 'mediump',
      preserveDrawingBuffer: new URLSearchParams(window.location.search).has('pixelCheck'),
    });
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(1);
    host.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0xffefc3, 18, 34);

    const isPoachView = mode === 'cook' && dishId === 'chicken-rice' && stepId === 'poach';
    const isChopView = mode === 'cook' && dishId === 'chicken-rice' && stepId === 'cut';
    const camera = new THREE.PerspectiveCamera(isPoachView || isChopView ? 34 : 38, 1, 0.1, 80);
    if (isPoachView) camera.position.set(6.3, 5.8, 7.8);
    else if (isChopView) camera.position.set(6.4, 6.3, 8.2);
    else camera.position.set(7.2, mode === 'menu' ? 8.8 : 7.2, mode === 'cook' ? 9.2 : 10.5);
    camera.lookAt(0, isPoachView || isChopView ? 0.88 : 0.55, isPoachView ? 0.55 : 0);

    scene.add(new THREE.HemisphereLight(0xfff7d7, 0x194a55, 2.8));
    const key = new THREE.DirectionalLight(0xffffff, 2.25);
    key.position.set(5, 9, 7);
    scene.add(key);
    const warm = new THREE.DirectionalLight(0xffac62, 0.65);
    warm.position.set(-5, 5, -5);
    scene.add(warm);

    const root = new THREE.Group();
    scene.add(root);
    const { dispose, dynamics } = buildScene(root, mode, dishId, stepId);
    let disposed = false;
    let modelCleanup: (() => void) | undefined;
    if (mode === 'cook' && dishId === 'chicken-rice' && stepId === 'cut') {
      void loadBlenderCutChicken(root, dynamics).then((cleanup) => {
        if (disposed) cleanup();
        else modelCleanup = cleanup;
      }).catch(() => undefined);
    }
    if (mode === 'cook') {
      void setupPhysics(dynamics, dishId, stepId).then((physics) => {
        if (!physics) return;
        if (disposed) {
          physics.free();
          return;
        }
        dynamics.physics = physics;
      });
    }

    const resize = () => {
      const rect = host.getBoundingClientRect();
      const width = Math.max(1, Math.floor(rect.width));
      const height = Math.max(1, Math.floor(rect.height));
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(host);

    let raf = 0;
    let last = 0;
    const frameInterval = mode === 'menu' ? 1000 / 24 : 1000 / 30;
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      if (document.hidden || now - last < frameInterval) return;
      last = now - ((now - last) % frameInterval);
      const t = now / 1000;
      root.rotation.y = Math.sin(t * 0.32) * (mode === 'menu' ? 0.055 : 0.035);
      root.position.y = Math.sin(t * 1.2) * 0.025;
      updateDynamics(dynamics, visualRef.current, t);
      stepPhysics(dynamics.physics, visualRef.current);
      renderer.render(scene, camera);
    };
    raf = requestAnimationFrame(tick);
    renderer.render(scene, camera);

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      observer.disconnect();
      dynamics.physics?.free();
      modelCleanup?.();
      dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [mode, dishId, stepId]);

  return (
    <div className="voxel-layer" aria-hidden>
      <div ref={hostRef} className="voxel-host" />
      {dim && <div className="voxel-dim" />}
    </div>
  );
}

function buildScene(root: THREE.Group, mode: Mode, dishId: DishId, stepId?: string): { dispose: () => void; dynamics: DynamicMeshes } {
  const box = new THREE.BoxGeometry(1, 1, 1);
  const lowPoly = new THREE.DodecahedronGeometry(1, 0);
  const cylinder = new THREE.CylinderGeometry(1, 1, 1, 14);
  const materials = new Map<string, THREE.MeshLambertMaterial>();
  const meshes: THREE.Mesh[] = [];

  const material = (color: string) => {
    let existing = materials.get(color);
    if (!existing) {
      existing = new THREE.MeshLambertMaterial({
        color,
        flatShading: true,
      });
      materials.set(color, existing);
    }
    return existing;
  };

  const cube = (color: string, x: number, y: number, z: number, sx = 1, sy = 1, sz = 1) => {
    const mesh = new THREE.Mesh(box, material(color));
    mesh.position.set(x, y, z);
    mesh.scale.set(sx, sy, sz);
    root.add(mesh);
    meshes.push(mesh);
    return mesh;
  };

  const poly = (color: string, x: number, y: number, z: number, sx = 1, sy = 1, sz = 1) => {
    const mesh = new THREE.Mesh(lowPoly, material(color));
    mesh.position.set(x, y, z);
    mesh.scale.set(sx, sy, sz);
    root.add(mesh);
    meshes.push(mesh);
    return mesh;
  };

  const cyl = (color: string, x: number, y: number, z: number, sx = 1, sy = 1, sz = 1) => {
    const mesh = new THREE.Mesh(cylinder, material(color));
    mesh.position.set(x, y, z);
    mesh.scale.set(sx, sy, sz);
    root.add(mesh);
    meshes.push(mesh);
    return mesh;
  };

  floor(cube, mode === 'menu' ? 5 : 4);
  stall(cube, dishId, mode);

  let dynamics: DynamicMeshes = {};
  if (mode === 'menu') {
    dish(cube, 'chicken-rice', 0, 0, 0.4, 1.08);
    tables(cube);
  } else if (mode === 'cook') {
    cookingProp(cube, poly, cyl, dishId, stepId);
    dynamics = dynamicProp(cube, poly, cyl, dishId, stepId);
  } else {
    dish(cube, dishId, 0, 0, 0.45, 1.26);
    cube(C.yellow, -1.3, 2.4, -1.8, 0.22, 0.22, 0.22);
    cube(C.yellow, 0, 2.72, -1.7, 0.26, 0.26, 0.26);
    cube(C.yellow, 1.3, 2.4, -1.8, 0.22, 0.22, 0.22);
  }

  meshes.forEach((mesh) => {
    if (!mesh.userData.dynamic) {
      mesh.updateMatrix();
      mesh.matrixAutoUpdate = false;
    }
  });

  return {
    dynamics,
    dispose: () => {
      meshes.forEach((mesh) => {
        root.remove(mesh);
      });
      box.dispose();
      lowPoly.dispose();
      cylinder.dispose();
      materials.forEach((m) => m.dispose());
    },
  };
}

async function loadBlenderCutChicken(root: THREE.Group, dynamics: DynamicMeshes) {
  const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');
  const loader = new GLTFLoader();
  const gltf = await loader.loadAsync(`${import.meta.env.BASE_URL}models/hainanese_chicken_cut.glb`);
  const model = gltf.scene;
  const loadedMeshes: THREE.Mesh[] = [];
  const loadedMaterials = new Set<THREE.Material>();
  const body: THREE.Mesh[] = [];
  const parts: Record<string, THREE.Mesh[]> = {
    'left-wing': [],
    'left-drumlet': [],
    'right-drumlet': [],
    'right-wing': [],
  };

  model.name = 'blender-cut-chicken';
  model.traverse((object) => {
    const mesh = object as THREE.Mesh;
    if (!mesh.isMesh) return;
    mesh.frustumCulled = false;
    mesh.matrixAutoUpdate = true;
    captureBase(mesh);
    loadedMeshes.push(mesh);
    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    materials.forEach((material) => loadedMaterials.add(material));

    const name = mesh.name.toLowerCase();
    if (name.startsWith('body_')) body.push(mesh);
    else if (name.startsWith('left_wing')) parts['left-wing'].push(mesh);
    else if (name.startsWith('left_drumlet')) parts['left-drumlet'].push(mesh);
    else if (name.startsWith('right_drumlet')) parts['right-drumlet'].push(mesh);
    else if (name.startsWith('right_wing')) parts['right-wing'].push(mesh);
  });

  if (!body.length || Object.values(parts).some((list) => !list.length)) {
    throw new Error('Blender chicken model is missing named cut parts');
  }

  dynamics.cutChickenBody?.forEach((mesh) => { mesh.visible = false; });
  Object.values(dynamics.cutChickenParts ?? {}).flat().forEach((mesh) => { mesh.visible = false; });
  dynamics.cutChickenBody = body;
  dynamics.cutChickenParts = parts;
  root.add(model);

  return () => {
    root.remove(model);
    loadedMeshes.forEach((mesh) => {
      mesh.geometry.dispose();
    });
    loadedMaterials.forEach((material) => material.dispose());
  };
}

function dynamicProp(cube: CubeFn, poly: CubeFn, cyl: CubeFn, dishId: DishId, stepId?: string): DynamicMeshes {
  const dynamics: DynamicMeshes = {};
  if (dishId === 'chicken-rice' && stepId === 'cut') {
    dynamics.cutChickenBody = [
      pose(remember(poly('#F3C58D', 0, 0.82, 0.56, 0.86, 0.4, 0.68)), 0.04, 0, 0),
      pose(remember(poly('#FFE0AB', -0.26, 1.04, 0.42, 0.32, 0.15, 0.3)), 0.08, -0.12, -0.06),
      pose(remember(poly('#FFD8A0', 0.24, 1.04, 0.46, 0.32, 0.15, 0.28)), 0.08, 0.1, 0.05),
      remember(cube('#D58A48', 0, 1.1, 0.24, 0.58, 0.04, 0.08)),
      pose(remember(poly('#F7D8A6', 0, 1.1, -0.02, 0.22, 0.1, 0.16)), -0.1, 0, 0),
      remember(cube('#FFF0C9', 0, 1.18, 0.66, 0.42, 0.035, 0.1)),
    ];
    dynamics.cutChickenParts = {
      'left-wing': [
        pose(remember(poly('#E9AE72', -0.62, 0.84, 0.45, 0.22, 0.11, 0.32)), 0.04, -0.22, -0.08),
        pose(remember(poly('#F2BF82', -0.82, 0.84, 0.48, 0.13, 0.08, 0.18)), 0, -0.32, -0.16),
        remember(cube('#C0743C', -0.73, 0.9, 0.25, 0.16, 0.04, 0.06)),
      ],
      'left-drumlet': [
        pose(remember(poly('#DE914F', -0.38, 0.68, 1.0, 0.22, 0.18, 0.46)), 0.08, 0.24, -0.08),
        pose(remember(cyl('#FFF2D6', -0.52, 0.68, 1.34, 0.065, 0.25, 0.065)), Math.PI / 2, 0.24, 0),
        pose(remember(poly('#FFF2D6', -0.62, 0.68, 1.52, 0.12, 0.1, 0.12)), 0, 0.24, 0),
      ],
      'right-drumlet': [
        pose(remember(poly('#DE914F', 0.38, 0.68, 1.0, 0.22, 0.18, 0.46)), 0.08, -0.24, 0.08),
        pose(remember(cyl('#FFF2D6', 0.52, 0.68, 1.34, 0.065, 0.25, 0.065)), Math.PI / 2, -0.24, 0),
        pose(remember(poly('#FFF2D6', 0.62, 0.68, 1.52, 0.12, 0.1, 0.12)), 0, -0.24, 0),
      ],
      'right-wing': [
        pose(remember(poly('#E9AE72', 0.62, 0.84, 0.45, 0.22, 0.11, 0.32)), 0.04, 0.22, 0.08),
        pose(remember(poly('#F2BF82', 0.82, 0.84, 0.48, 0.13, 0.08, 0.18)), 0, 0.32, 0.16),
        remember(cube('#C0743C', 0.73, 0.9, 0.25, 0.16, 0.04, 0.06)),
      ],
    };
    dynamics.cutJoints = [];
    dynamics.cutKnife = [
      remember(cube(C.steel, 0, 1.92, 0.38, 0.52, 0.38, 0.08)),
      remember(cube(C.ink, 0, 1.69, 0.38, 0.58, 0.08, 0.1)),
      remember(cube(C.yellow, 0, 2.28, 0.38, 0.15, 0.46, 0.15)),
      remember(cube(C.ink, 0, 2.54, 0.38, 0.19, 0.08, 0.17)),
    ];
  }

  if (dishId === 'chicken-rice' && stepId === 'poach') {
    dynamics.poachMercury = remember(cyl(C.red, 1.02, 0.76, 0.72, 0.035, 0.28, 0.035));
    dynamics.poachHandle = remember(poly(C.yellow, 1.02, 1.04, 0.72, 0.11, 0.11, 0.11));
    dynamics.poachChicken = wholeChickenModel(cube, poly, cyl, -0.08, 1.16, 0.5, 0.98, true);
    dynamics.poachSteam = [
      remember(cube(C.cream, -0.66, 1.44, 0.28, 0.08, 0.24, 0.08)),
      remember(cube('#DDF2DA', -0.26, 1.58, 0.06, 0.09, 0.22, 0.09)),
      remember(cube(C.cream, 0.18, 1.5, 0.22, 0.08, 0.26, 0.08)),
      remember(cube('#DDF2DA', 0.54, 1.48, 0.0, 0.08, 0.2, 0.08)),
      remember(cube(C.cream, 0.74, 1.34, 0.48, 0.06, 0.18, 0.06)),
    ];
  }

  if ((dishId === 'chicken-rice' && stepId === 'aromatics') || (dishId === 'laksa' && stepId === 'broth')) {
    const ids = dishId === 'chicken-rice'
      ? [
          ['shallot', '#B34779'],
          ['garlic', C.cream],
          ['ginger', C.prata],
          ['pandan', C.green],
        ]
      : [
          ['stock', C.blue],
          ['coconut', C.cream],
          ['tau-pok', C.yellow],
        ];
    dynamics.ingredients = {};
    ids.forEach(([id, color], i) => {
      const parts = ingredientVoxels(cube, id, color, -0.54 + i * 0.36, 1.86, 0.9 + (i % 2) * 0.1, 1.28, poly);
      parts.forEach((mesh) => {
        mesh.visible = false;
      });
      dynamics.ingredients![id] = parts;
    });
    dynamics.sizzle = [-0.5, 0, 0.5].map((x, i) => {
      const mesh = remember(cube(i === 1 ? C.yellow : C.cream, x, 1.62, 0.82 + i * 0.08, 0.08, 0.08, 0.08));
      mesh.visible = false;
      return mesh;
    });
  }

  if ((dishId === 'laksa' && stepId === 'rempah') || (dishId === 'prata' && stepId === 'knead')) {
    dynamics.stirSpoon = cube(C.cream, 0.82, 0.94, 0.78, 0.14, 0.78, 0.14);
    dynamics.stirFood = dishId === 'laksa'
      ? [
          remember(cube(C.redDark, -0.12, 0.84, 0.78, 0.5, 0.12, 0.34)),
          remember(cube(C.red, 0.2, 0.92, 0.88, 0.28, 0.08, 0.24)),
          remember(cube(C.yellow, -0.36, 0.94, 0.9, 0.16, 0.08, 0.16)),
        ]
      : [
          remember(cube(C.prataLight, -0.1, 0.66, 0.62, 0.92, 0.12, 0.62)),
          remember(cube(C.prata, 0.24, 0.78, 0.72, 0.34, 0.08, 0.3)),
        ];
  }

  if (dishId === 'laksa' && stepId === 'noodles') {
    dynamics.noodleBasket = cube(C.noodle, 0, 1.15, 0.55, 1.24, 0.14, 0.82);
  }

  if (dishId === 'prata' && stepId === 'stretch') {
    dynamics.dough = cube(C.prataLight, 0.12, 0.52, 0.52, 1.1, 0.1, 0.72);
  }

  if (dishId === 'prata' && stepId === 'fold') {
    dynamics.foldCorners = [
      cube(C.prataLight, -0.75, 0.62, -0.12, 0.36, 0.1, 0.36),
      cube(C.prataLight, 0.75, 0.62, -0.12, 0.36, 0.1, 0.36),
      cube(C.prataLight, -0.75, 0.62, 0.84, 0.36, 0.1, 0.36),
      cube(C.prataLight, 0.75, 0.62, 0.84, 0.36, 0.1, 0.36),
    ];
  }

  if (dishId === 'chicken-rice' && stepId === 'plate') {
    dynamics.plateParts = {
      rice: [
        remember(poly(C.rice, -0.36, 0.82, 0.42, 0.58, 0.24, 0.48)),
        remember(poly('#FFF8E4', -0.39, 1.0, 0.4, 0.42, 0.14, 0.36)),
        remember(cube(C.cream, -0.58, 1.06, 0.26, 0.08, 0.05, 0.08)),
        remember(cube('#F4E8C8', -0.22, 1.1, 0.54, 0.08, 0.05, 0.08)),
      ],
      chicken: [-0.24, -0.08, 0.08, 0.24].flatMap((offset, i) => [
        remember(poly(C.chicken, 0.46 + offset, 0.92 + i * 0.018, 0.36, 0.13, 0.08, 0.54)),
        remember(cube(C.chickenDark, 0.46 + offset, 0.99 + i * 0.018, 0.08, 0.13, 0.04, 0.08)),
        remember(cube('#F2C08A', 0.46 + offset, 0.99 + i * 0.018, 0.62, 0.1, 0.035, 0.08)),
      ]),
      sauce: [
        remember(cyl(C.redDark, 0.8, 0.88, 0.85, 0.25, 0.13, 0.25)),
        remember(cyl(C.red, 0.8, 0.99, 0.85, 0.2, 0.05, 0.2)),
        remember(cube('#FFD76C', 0.67, 1.02, 0.72, 0.06, 0.04, 0.06)),
      ],
    };
    Object.values(dynamics.plateParts).flat().forEach((mesh) => { mesh.visible = false; });
  }

  return dynamics;
}

function ingredientVoxels(cube: CubeFn, id: string, color: string, x: number, y: number, z: number, s = 1, poly: CubeFn = cube, cyl: CubeFn = cube) {
  const parts: THREE.Mesh[] = [];
  const add = (partColor: string, px: number, py: number, pz: number, sx: number, sy: number, sz: number, maker: CubeFn = cube) => {
    const mesh = remember(maker(partColor, x + px * s, y + py * s, z + pz * s, sx * s, sy * s, sz * s));
    parts.push(mesh);
    return mesh;
  };

  if (id === 'shallot') {
    add(color, 0, 0.02, 0, 0.2, 0.22, 0.18, poly);
    add('#D77AA3', -0.07, 0.12, 0.02, 0.12, 0.12, 0.11, poly);
    add('#8A2759', 0.07, 0.08, -0.01, 0.08, 0.16, 0.08, poly);
    add(C.cream, 0, -0.15, 0, 0.08, 0.05, 0.08);
    add('#6CAA46', 0.02, 0.24, 0.02, 0.05, 0.11, 0.05);
  } else if (id === 'garlic') {
    add('#FFF8DF', -0.12, 0.02, 0.02, 0.12, 0.16, 0.1, poly);
    add(C.cream, 0, 0.06, -0.02, 0.14, 0.18, 0.12, poly);
    add('#F3DC8B', 0.13, 0.02, 0.03, 0.11, 0.15, 0.1, poly);
    add('#D8B96C', 0, -0.1, 0.03, 0.22, 0.05, 0.1);
    add('#FFFDF0', 0.02, 0.22, -0.02, 0.06, 0.05, 0.06);
  } else if (id === 'ginger') {
    const main = add(color, -0.05, 0, 0, 0.32, 0.13, 0.17, poly);
    main.rotation.z = -0.16;
    const branch = add('#F2B65C', 0.16, 0.08, 0.03, 0.22, 0.12, 0.15, poly);
    branch.rotation.z = 0.28;
    add('#AD6A2C', -0.22, 0.08, 0.05, 0.08, 0.05, 0.07, poly);
    add('#AD6A2C', 0.06, 0.15, -0.08, 0.06, 0.05, 0.06, poly);
  } else if (id === 'pandan') {
    const leafA = add(C.green, -0.16, 0.02, -0.02, 0.07, 0.06, 0.62);
    const leafB = add('#2F7F3A', 0, 0.07, 0.04, 0.07, 0.06, 0.68);
    const leafC = add('#8ACF69', 0.16, 0.03, -0.05, 0.07, 0.06, 0.58);
    leafA.rotation.y = -0.24;
    leafB.rotation.y = 0.06;
    leafC.rotation.y = 0.24;
    add('#245F2D', 0, -0.06, -0.2, 0.18, 0.07, 0.12);
  } else if (id === 'stock') {
    add(C.blue, -0.1, 0.02, 0, 0.2, 0.16, 0.2, cyl);
    add('#B9DDF2', 0.1, 0.08, 0, 0.12, 0.1, 0.12, cyl);
    add('#5B9DCA', 0, -0.06, 0.08, 0.28, 0.08, 0.2);
  } else if (id === 'coconut') {
    add(C.cream, 0, 0.02, 0, 0.26, 0.12, 0.2);
    add('#FFF9E8', -0.12, 0.12, 0.02, 0.14, 0.1, 0.14);
    add('#E5CFA8', 0.12, 0.12, -0.02, 0.12, 0.08, 0.12);
  } else if (id === 'tau-pok') {
    add(color, 0, 0, 0, 0.26, 0.16, 0.24);
    add('#F2C66B', -0.08, 0.13, 0.04, 0.14, 0.08, 0.12);
    add('#A76A25', 0.1, 0.11, -0.05, 0.08, 0.05, 0.08);
  } else {
    add(color, 0, 0, 0, 0.22, 0.16, 0.22);
  }

  return parts;
}

function remember(mesh: THREE.Mesh) {
  mesh.userData.dynamic = true;
  mesh.matrixAutoUpdate = true;
  captureBase(mesh);
  return mesh;
}

function captureBase(mesh: THREE.Mesh) {
  mesh.userData.dynamic = true;
  mesh.userData.base = {
    x: mesh.position.x,
    y: mesh.position.y,
    z: mesh.position.z,
    sx: mesh.scale.x,
    sy: mesh.scale.y,
    sz: mesh.scale.z,
    rx: mesh.rotation.x,
    ry: mesh.rotation.y,
    rz: mesh.rotation.z,
  };
}

function pose(mesh: THREE.Mesh, rx: number, ry: number, rz: number) {
  mesh.rotation.set(rx, ry, rz);
  const base = mesh.userData.base as ReturnType<typeof baseFor>;
  base.rx = rx;
  base.ry = ry;
  base.rz = rz;
  return mesh;
}

function baseFor(mesh: THREE.Mesh) {
  return mesh.userData.base as {
    x: number;
    y: number;
    z: number;
    sx: number;
    sy: number;
    sz: number;
    rx: number;
    ry: number;
    rz: number;
  };
}

async function setupPhysics(dynamics: DynamicMeshes, dishId: DishId, stepId?: string): Promise<PhysicsController | null> {
  const actors: Record<string, PhysicsActor> = {};
  const source = dynamics.ingredients ?? dynamics.plateParts;
  if (!source) return null;

  Object.entries(source).forEach(([id, parts], i) => {
    actors[id] = createPhysicsActor(id, parts, dynamics.plateParts ? 0.28 : 1.35, impulseFor(dishId, stepId, i));
  });
  if (!Object.keys(actors).length) return null;

  const CANNON = await import('cannon-es');
  const world = new CANNON.World({
    gravity: new CANNON.Vec3(0, -9.82, 0),
  });
  world.allowSleep = true;
  world.broadphase = new CANNON.SAPBroadphase(world);

  const addStatic = (x: number, y: number, z: number, hx: number, hy: number, hz: number, friction = 0.96) => {
    const body = new CANNON.Body({
      type: CANNON.Body.STATIC,
      position: new CANNON.Vec3(x, y, z),
      shape: new CANNON.Box(new CANNON.Vec3(hx, hy, hz)),
    });
    body.material = new CANNON.Material({ friction, restitution: 0.03 });
    world.addBody(body);
  };

  if (dynamics.ingredients) {
    addStatic(0, 1.56, 0.95, 1.35, 0.08, 0.9);
    addStatic(-1.28, 1.84, 0.95, 0.07, 0.32, 0.88);
    addStatic(1.28, 1.84, 0.95, 0.07, 0.32, 0.88);
    addStatic(0, 1.84, 0.22, 1.34, 0.32, 0.07);
    addStatic(0, 1.84, 1.66, 1.34, 0.32, 0.07);
  } else {
    addStatic(0, 0.7, 0.42, 1.18, 0.08, 0.76);
    addStatic(-1.08, 0.95, 0.42, 0.06, 0.26, 0.76);
    addStatic(1.08, 0.95, 0.42, 0.06, 0.26, 0.76);
    addStatic(0, 0.95, -0.25, 1.14, 0.26, 0.06);
    addStatic(0, 0.95, 1.06, 1.14, 0.26, 0.06);
  }

  return {
    CANNON,
    world,
    actors,
    free: () => {
      world.bodies.slice().forEach((body) => world.removeBody(body));
    },
  };
}

function createPhysicsActor(id: string, parts: THREE.Mesh[], spawnLift: number, impulse: THREE.Vector3): PhysicsActor {
  const bounds = parts.reduce((box, mesh) => {
    const base = baseFor(mesh);
    box.min.x = Math.min(box.min.x, base.x - base.sx / 2);
    box.min.y = Math.min(box.min.y, base.y - base.sy / 2);
    box.min.z = Math.min(box.min.z, base.z - base.sz / 2);
    box.max.x = Math.max(box.max.x, base.x + base.sx / 2);
    box.max.y = Math.max(box.max.y, base.y + base.sy / 2);
    box.max.z = Math.max(box.max.z, base.z + base.sz / 2);
    return box;
  }, new THREE.Box3(
    new THREE.Vector3(Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY),
    new THREE.Vector3(Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY),
  ));
  const origin = bounds.getCenter(new THREE.Vector3());
  const size = bounds.getSize(new THREE.Vector3());
  return {
    id,
    parts,
    origin,
    offsets: parts.map((mesh) => {
      const base = baseFor(mesh);
      return new THREE.Vector3(base.x - origin.x, base.y - origin.y, base.z - origin.z);
    }),
    halfExtents: new THREE.Vector3(
      Math.max(0.08, size.x * 0.42),
      Math.max(0.07, size.y * 0.42),
      Math.max(0.08, size.z * 0.42),
    ),
    spawnLift,
    impulse,
  };
}

function impulseFor(dishId: DishId, stepId: string | undefined, i: number) {
  if (dishId === 'chicken-rice' && stepId === 'plate') {
    return new THREE.Vector3(i === 1 ? -0.1 : 0.1, 0.2, i === 2 ? -0.14 : 0.08);
  }
  const direction = i % 2 === 0 ? 1 : -1;
  return new THREE.Vector3(direction * 0.45, 0.72, -0.28 - i * 0.04);
}

function stepPhysics(physics: PhysicsController | undefined, state: VisualState) {
  if (!physics) return;
  const active = new Set([...(state.placedIds ?? []), ...(state.platePlaced ?? [])]);
  let hasBody = false;

  active.forEach((id) => {
    const actor = physics.actors[id];
    if (!actor) return;
    hasBody = true;
    if (!actor.body) spawnActor(physics, actor);
  });

  if (!hasBody) return;
  const pulse = state.stagePulse ?? 0;
  let appliedPulse = false;
  if (pulse && pulse !== physics.lastPulse) {
    active.forEach((id) => {
      const actor = physics.actors[id];
      if (!actor?.body) return;
      applyStageImpulse(physics, actor, state);
      appliedPulse = true;
    });
    if (appliedPulse) physics.lastPulse = pulse;
  }
  const liveActors = Object.values(physics.actors).filter((actor) => actor.body);
  const anyAwake = liveActors.some((actor) => actor.body?.sleepState !== physics.CANNON.Body.SLEEPING);
  if (appliedPulse || anyAwake) physics.world.step(1 / 30);
  liveActors.forEach((actor) => {
    if (!actor.body) return;
    syncActor(actor);
  });
}

function applyStageImpulse(physics: PhysicsController, actor: PhysicsActor, state: VisualState) {
  if (!actor.body) return;
  const { CANNON } = physics;
  const side = ((state.stageX ?? 0.5) - 0.5) * 1.3;
  const depth = ((state.stageY ?? 0.5) - 0.5) * 0.45;
  actor.body.wakeUp();
  actor.body.applyImpulse(
    new CANNON.Vec3(actor.impulse.x * 0.45 + side, 1.24, actor.impulse.z * 0.35 - 0.18 + depth),
    actor.body.position,
  );
  actor.body.angularVelocity.x += 2.8 + side;
  actor.body.angularVelocity.y += actor.impulse.x * 1.8;
  actor.body.angularVelocity.z += side * -2.2;
}

function spawnActor(physics: PhysicsController, actor: PhysicsActor) {
  const { CANNON, world } = physics;
  const jitter = Math.sin(actor.id.length * 2.31) * 0.12;
  const spawn = {
    x: actor.origin.x + jitter,
    y: actor.origin.y + actor.spawnLift,
    z: actor.origin.z + 0.28,
  };
  actor.body = new CANNON.Body({
    mass: 0.68,
    position: new CANNON.Vec3(spawn.x, spawn.y, spawn.z),
    shape: new CANNON.Box(new CANNON.Vec3(actor.halfExtents.x, actor.halfExtents.y, actor.halfExtents.z)),
    material: new CANNON.Material({ friction: 0.92, restitution: 0.16 }),
  });
  actor.body.velocity.set(actor.impulse.x, actor.impulse.y, actor.impulse.z);
  actor.body.angularVelocity.set(actor.impulse.z * 3.2, actor.impulse.x * 2.4, actor.impulse.x * -2.1);
  actor.body.linearDamping = 0.24;
  actor.body.angularDamping = 0.48;
  actor.body.allowSleep = true;
  actor.body.sleepSpeedLimit = 0.06;
  actor.body.sleepTimeLimit = 0.35;
  world.addBody(actor.body);
  actor.parts.forEach((mesh) => {
    mesh.visible = true;
  });
}

function syncActor(actor: PhysicsActor) {
  if (!actor.body) return;
  const p = actor.body.position;
  const q = actor.body.quaternion;
  const rotation = new THREE.Quaternion(q.x, q.y, q.z, q.w);
  if (p.y < -0.6) {
    actor.body.position.set(actor.origin.x, actor.origin.y + 0.3, actor.origin.z);
    actor.body.velocity.set(0, 0, 0);
    actor.body.angularVelocity.set(0, 0, 0);
    actor.body.quaternion.set(0, 0, 0, 1);
  }
  actor.parts.forEach((mesh, i) => {
    const offset = actor.offsets[i].clone().applyQuaternion(rotation);
    mesh.visible = true;
    mesh.position.set(p.x + offset.x, p.y + offset.y, p.z + offset.z);
    mesh.quaternion.copy(rotation);
  });
}

function actionHop(state: VisualState, t: number, duration = 0.55) {
  if (!state.stageAt) return 0;
  const elapsed = t - state.stageAt / 1000;
  if (elapsed < 0 || elapsed > duration) return 0;
  return Math.sin((elapsed / duration) * Math.PI);
}

function updateDynamics(dynamics: DynamicMeshes, state: VisualState, t: number) {
  if (dynamics.poachMercury && dynamics.poachHandle) {
    const value = state.sliderValue ?? 0.18;
    const mercuryHeight = 0.18 + value * 0.92;
    dynamics.poachMercury.scale.y = mercuryHeight;
    dynamics.poachMercury.position.y = 0.46 + mercuryHeight * 0.5;
    dynamics.poachHandle.position.y = 0.55 + value * 1.18;
    dynamics.poachHandle.rotation.y = Math.sin(t * 12) * (state.inZone ? 0.02 : 0.09);
  }
  if (dynamics.poachChicken) {
    const hop = actionHop(state, t, 0.62);
    const flipCount = state.poachFlipCount ?? 0;
    dynamics.poachChicken.forEach((mesh, i) => {
      const base = baseFor(mesh);
      const side = i % 2 === 0 ? 1 : -1;
      mesh.position.set(
        base.x + Math.sin(t * 3.2 + i) * 0.01,
        base.y + hop * 0.42 + Math.sin(t * 4.5 + i) * 0.012,
        base.z + hop * 0.1,
      );
      mesh.rotation.x = base.rx + flipCount * Math.PI + hop * Math.PI;
      mesh.rotation.y = base.ry + side * (0.08 + hop * 0.3);
      mesh.rotation.z = base.rz + Math.sin(t * 2.6 + i) * 0.035 + side * hop * 0.16;
    });
  }
  dynamics.poachSteam?.forEach((mesh, i) => {
    const heat = state.inZone ? 0.25 : 0.08;
    const base = baseFor(mesh);
    mesh.visible = true;
    const lift = (t * (0.55 + heat * 1.8) + i * 0.26) % 1.05;
    const sway = Math.sin(t * 1.7 + i) * (0.04 + heat * 0.08);
    mesh.position.set(base.x + sway, base.y + lift, base.z + Math.cos(t * 1.3 + i) * 0.04);
    const fade = 1 - lift / 1.05;
    mesh.scale.set(base.sx * (1 + lift * 0.5), base.sy * (0.6 + fade), base.sz * (1 + lift * 0.5));
  });

  if (dynamics.cutKnife) {
    const knifeX = -1.24 + (state.cutKnifeX ?? 0.5) * 2.48;
    const chop = actionHop(state, t, 0.28);
    dynamics.cutKnife.forEach((mesh, i) => {
      const base = baseFor(mesh);
      mesh.position.set(knifeX, base.y - chop * 0.58, base.z);
      mesh.rotation.z = Math.sin(t * 8) * 0.015 + chop * (i === 0 ? -0.08 : 0.05);
      mesh.rotation.x = chop * 0.12;
    });
  }

  dynamics.cutChickenBody?.forEach((mesh, i) => {
    const base = baseFor(mesh);
    const cutCount = state.cutIds?.length ?? 0;
    mesh.position.set(base.x, base.y + Math.sin(t * 3 + i) * 0.008 - cutCount * 0.006, base.z);
    mesh.rotation.x = base.rx;
    mesh.rotation.y = base.ry;
    mesh.rotation.z = base.rz + (cutCount / 4) * 0.025;
  });

  if (dynamics.cutJoints) {
    const cutOrder = ['left-wing', 'left-drumlet', 'right-drumlet', 'right-wing'];
    const cutIds = new Set(state.cutIds ?? []);
    const activeIndex = state.cutIndex ?? 0;
    dynamics.cutJoints.forEach((mesh, i) => {
      const base = baseFor(mesh);
      const isCut = cutIds.has(cutOrder[i]);
      const active = i === activeIndex && !isCut;
      mesh.visible = active;
      if (active) {
        const pulse = 1.35 + (Math.sin(t * 9) + 1) * 0.22;
        mesh.position.set(base.x, base.y + (active ? 0.08 : 0), base.z);
        mesh.scale.set(base.sx * pulse, base.sy * pulse, base.sz * pulse);
      }
    });
  }

  if (dynamics.cutChickenParts) {
    const cutIds = new Set(state.cutIds ?? []);
    const offsetFor: Record<string, [number, number, number, number]> = {
      'left-wing': [-0.6, 0.1, -0.18, -0.42],
      'left-drumlet': [-0.44, 0.1, 0.46, -0.28],
      'right-drumlet': [0.44, 0.1, 0.46, 0.28],
      'right-wing': [0.6, 0.1, -0.18, 0.42],
    };
    Object.entries(dynamics.cutChickenParts).forEach(([id, parts]) => {
      const cut = cutIds.has(id);
      const [dx, dy, dz, rz] = offsetFor[id] ?? [0, 0, 0, 0];
      const hop = state.lastCutId === id ? actionHop(state, t, 0.48) : 0;
      parts.forEach((mesh, i) => {
        const base = baseFor(mesh);
        const wobble = cut ? Math.sin(t * 5 + i) * 0.012 : 0;
        mesh.position.set(base.x + (cut ? dx : 0), base.y + (cut ? dy : 0) + hop * 0.26 + wobble, base.z + (cut ? dz : 0));
        mesh.rotation.x = base.rx + (cut ? hop * Math.PI * 0.45 : 0);
        mesh.rotation.y = base.ry + (cut ? rz * 0.5 : 0);
        mesh.rotation.z = base.rz + (cut ? rz + hop * rz : 0);
      });
    });
  }

  if (dynamics.ingredients) {
    const placed = new Set(state.placedIds ?? []);
    Object.entries(dynamics.ingredients).forEach(([id, parts], i) => {
      const visible = placed.has(id) || state.dragId === id;
      parts.forEach((mesh, partIndex) => {
        const base = baseFor(mesh);
        mesh.visible = visible;
        if (visible) {
          const active = state.dragId === id && !placed.has(id);
          const bounce = active ? 0.38 + Math.sin(t * 8 + partIndex) * 0.05 : Math.sin(t * 5 + i + partIndex) * 0.035;
          mesh.position.set(
            base.x + Math.sin(t * 2.2 + partIndex) * (active ? 0.025 : 0.006),
            base.y + bounce,
            base.z + Math.cos(t * 1.8 + partIndex) * (active ? 0.025 : 0.006),
          );
          mesh.rotation.y = t * (active ? 2.4 : 1.2) + i;
          const scale = active ? 1.2 : 1;
          mesh.scale.set(base.sx * scale, base.sy * scale, base.sz * scale);
        }
      });
    });
  }

  dynamics.sizzle?.forEach((mesh, i) => {
    const hasFood = (state.placedIds?.length ?? 0) > 0 || !!state.dragId;
    mesh.visible = hasFood;
    if (hasFood) {
      const base = baseFor(mesh);
      const pop = (Math.sin(t * 8 + i * 1.4) + 1) * 0.5;
      mesh.position.set(base.x + Math.sin(t * 5 + i) * 0.05, base.y + pop * 0.5, base.z);
      mesh.scale.set(base.sx * (0.6 + pop), base.sy * (0.6 + pop), base.sz * (0.6 + pop));
    }
  });

  if (dynamics.stirSpoon) {
    const progress = state.stirProgress ?? 0;
    const hop = actionHop(state, t, 0.42);
    const angle = t * 2 + progress * Math.PI * 8;
    const radius = 0.62;
    dynamics.stirSpoon.position.x = Math.cos(angle) * radius;
    dynamics.stirSpoon.position.z = 0.75 + Math.sin(angle) * radius * 0.58;
    dynamics.stirSpoon.rotation.z = angle;
    dynamics.stirSpoon.rotation.x = hop * Math.PI * 0.45;
    dynamics.stirSpoon.position.y = 0.9 + hop * 0.36 + Math.sin(t * 8) * 0.04;
  }

  dynamics.stirFood?.forEach((mesh, i) => {
    const base = baseFor(mesh);
    const progress = state.stirProgress ?? 0;
    const hop = actionHop(state, t, 0.46);
    const side = i % 2 === 0 ? 1 : -1;
    mesh.position.set(
      base.x + Math.sin(progress * 16 + i) * 0.08 + side * hop * 0.12,
      base.y + hop * 0.45 + Math.sin(t * 6 + i) * 0.015,
      base.z + Math.cos(progress * 14 + i) * 0.08 - hop * 0.08,
    );
    mesh.rotation.x = hop * Math.PI * side;
    mesh.rotation.y = progress * Math.PI * 3 + hop * side * 0.8;
    mesh.rotation.z = Math.sin(t * 3 + i) * 0.06;
  });

  if (dynamics.noodleBasket) {
    const progress = state.holdProgress ?? 0;
    dynamics.noodleBasket.position.y = 1.24 - Math.min(progress, 1) * 0.48;
    dynamics.noodleBasket.rotation.z = state.inZone ? Math.sin(t * 8) * 0.035 : 0;
  }

  if (dynamics.dough) {
    const progress = state.swipeProgress ?? 0;
    const drag = state.swipeDrag ?? 0;
    const hop = actionHop(state, t, 0.42);
    dynamics.dough.scale.x = 1.1 + progress * 1.15 + Math.abs(drag) * 0.42;
    dynamics.dough.scale.z = 0.72 - progress * 0.16 - Math.abs(drag) * 0.08;
    dynamics.dough.position.x = drag * 0.22;
    dynamics.dough.position.y = 0.52 + hop * 0.34 + Math.sin(t * 8) * 0.025;
    dynamics.dough.rotation.x = hop * Math.PI * 0.34;
    dynamics.dough.rotation.z = drag * 0.08;
  }

  dynamics.foldCorners?.forEach((mesh, i) => {
    const folded = state.foldedCorners?.[i] ?? false;
    const targetX = folded ? 0 : (i % 2 === 0 ? -0.75 : 0.75);
    const targetZ = folded ? 0.38 : (i < 2 ? -0.12 : 0.84);
    mesh.position.x += (targetX - mesh.position.x) * 0.2;
    mesh.position.z += (targetZ - mesh.position.z) * 0.2;
    mesh.rotation.y = folded ? Math.sin(t * 4 + i) * 0.08 : 0;
  });

  if (dynamics.plateParts) {
    const placed = new Set(state.platePlaced ?? []);
    Object.entries(dynamics.plateParts).forEach(([id, parts], i) => {
      const visible = placed.has(id) || state.dragId === id;
      parts.forEach((mesh, partIndex) => {
        const base = baseFor(mesh);
        mesh.visible = visible;
        if (visible) {
          const active = state.dragId === id && !placed.has(id);
          const lift = active ? 0.3 : 0;
          mesh.position.set(base.x, base.y + lift + Math.sin(t * 5 + i + partIndex) * 0.02, base.z);
          mesh.rotation.y = active ? Math.sin(t * 6 + partIndex) * 0.16 : 0;
        }
      });
    });
  }
}

function floor(cube: CubeFn, radius: number) {
  for (let x = -radius; x <= radius; x++) {
    for (let z = -radius; z <= radius; z++) {
      cube((x + z) % 2 === 0 ? C.floorA : C.floorB, x, -0.18, z, 0.96, 0.18, 0.96);
    }
  }
  cube(C.shadow, 0, -0.38, 0, radius * 2.2, 0.16, radius * 2.2);
}

function stall(cube: CubeFn, dishId: DishId, mode: Mode) {
  if (mode !== 'menu') {
    cube(C.tealDark, 0, 1.65, -5.8, 7.4, 2.8, 0.2);
    return;
  }

  const z = -5.2;
  cube(C.ink, 0, 1.18, z, 7.25, 0.28, 0.36);
  cube(C.cream, 0, 1.48, z, 6.8, 0.62, 0.48);
  cube(accent[dishId], 0, 1.98, z, 7.3, 0.54, 0.78);
  for (let x = -3; x <= 3; x++) cube(x % 2 ? C.cream : accent[dishId], x, 2.38, z + 0.22, 0.92, 0.36, 0.68);
  cube(C.ink, -3.45, 0.76, z + 0.08, 0.22, 1.18, 0.28);
  cube(C.ink, 3.45, 0.76, z + 0.08, 0.22, 1.18, 0.28);
  for (let x = -4.5; x <= 4.5; x += 1.5) {
    cube(C.ink, x, 2.82, z + 0.4, 0.06, 0.34, 0.06);
    cube(C.yellow, x, 2.58, z + 0.4, 0.18, 0.16, 0.18);
  }
}

function tables(cube: CubeFn) {
  for (let x = -4.8; x <= 4.8; x += 2.4) {
    cube(C.ink, x, 0.5, 3.75, 1.05, 0.16, 1.05);
    cube(C.tealDark, x, 0.68, 3.75, 0.82, 0.22, 0.82);
    cube(C.ink, x - 0.34, 0.22, 3.42, 0.12, 0.45, 0.12);
    cube(C.ink, x + 0.34, 0.22, 4.08, 0.12, 0.45, 0.12);
  }
}

function cookingProp(cube: CubeFn, poly: CubeFn, cyl: CubeFn, dishId: DishId, stepId?: string) {
  if (dishId === 'chicken-rice') {
    if (stepId === 'cut') cuttingBoard(cube, 0, 0, 0.48);
    else if (stepId === 'poach') poachPot(cube, poly, cyl, 0, 0, 0.55);
    else if (stepId === 'aromatics') {
      wok(cube, cyl, 0, 0.16, 0.22);
      ingredientVoxels(cube, 'shallot', '#B34779', -1.55, 0.86, 0.84, 0.95, poly, cyl);
      ingredientVoxels(cube, 'garlic', C.cream, -0.55, 0.86, 0.96, 0.95, poly, cyl);
      ingredientVoxels(cube, 'ginger', C.prata, 0.48, 0.86, 0.96, 0.95, poly, cyl);
      ingredientVoxels(cube, 'pandan', C.green, 1.42, 0.86, 0.84, 0.95, poly, cyl);
    } else if (stepId === 'plate') {
      plate(cube, 0, 0, 0.4, 1.12);
    } else dish(cube, dishId, 0, 0, 0.4, 1.12);
  } else if (dishId === 'laksa') {
    if (stepId === 'rempah') wok(cube, cyl, 0, 0, 0.8);
    else if (stepId === 'noodles') noodleBasket(cube, 0, 0, 0.55);
    else if (stepId === 'broth') {
      pot(cube, 0, 0.08, 0.28, false);
      ingredientVoxels(cube, 'stock', C.blue, -1.25, 0.84, 0.9, 0.92);
      ingredientVoxels(cube, 'coconut', C.cream, 0, 0.84, 0.98, 0.92);
      ingredientVoxels(cube, 'tau-pok', C.yellow, 1.22, 0.84, 0.9, 0.92);
    }
    else dish(cube, dishId, 0, 0, 0.4, 1.1);
  } else if (dishId === 'prata') {
    if (stepId === 'knead') dough(cube, 0, 0.2, 0.6, 1.2);
    else if (stepId === 'stretch') dough(cube, 0, 0.16, 0.6, 1.65);
    else dish(cube, dishId, 0, 0, 0.4, 1.16);
  }
}

function cuttingBoard(cube: CubeFn, x: number, y: number, z: number) {
  cube(C.ink, x, y + 0.18, z, 3.18, 0.18, 1.78);
  cube('#A76634', x, y + 0.32, z, 2.92, 0.16, 1.52);
  cube('#D49B5B', x, y + 0.43, z - 0.44, 2.36, 0.04, 0.08);
  cube('#8F4E2C', x, y + 0.44, z + 0.32, 2.2, 0.04, 0.07);
  cube('#E6BD7A', x - 1.2, y + 0.47, z - 0.58, 0.32, 0.06, 0.16);
  cube('#E6BD7A', x + 1.2, y + 0.47, z + 0.58, 0.32, 0.06, 0.16);
}

function dish(cube: CubeFn, id: DishId, x: number, y: number, z: number, s: number) {
  if (id === 'chicken-rice') {
    plate(cube, x, y, z, s);
    rice(cube, x - 0.26 * s, y + 0.36 * s, z, s);
    chicken(cube, x + 0.46 * s, y + 0.45 * s, z - 0.02 * s, s);
    for (let i = 0; i < 4; i++) cube(C.green, x + (-0.76 + i * 0.18) * s, y + 0.48 * s, z + 0.46 * s, 0.14 * s, 0.08 * s, 0.34 * s);
    cube(C.red, x + 0.82 * s, y + 0.48 * s, z + 0.46 * s, 0.32 * s, 0.12 * s, 0.24 * s);
  } else if (id === 'laksa') {
    bowl(cube, x, y, z, s, C.red, C.soup);
    for (let i = -2; i <= 2; i++) cube(C.noodle, x + i * 0.18 * s, y + 0.66 * s, z - 0.05 * s, 0.12 * s, 0.08 * s, 0.95 * s);
    cube(C.chicken, x - 0.48 * s, y + 0.74 * s, z + 0.3 * s, 0.36 * s, 0.12 * s, 0.26 * s);
    cube(C.green, x + 0.48 * s, y + 0.74 * s, z - 0.26 * s, 0.14 * s, 0.12 * s, 0.42 * s);
    cube(C.redDark, x + 0.56 * s, y + 0.74 * s, z + 0.22 * s, 0.26 * s, 0.12 * s, 0.26 * s);
  } else {
    cube(C.ink, x, y + 0.12 * s, z, 2.1 * s, 0.18 * s, 1.55 * s);
    cube(C.cream, x, y + 0.24 * s, z, 1.92 * s, 0.12 * s, 1.38 * s);
    cube(C.prata, x - 0.16 * s, y + 0.4 * s, z, 1.3 * s, 0.16 * s, 1.0 * s);
    cube(C.prataLight, x + 0.1 * s, y + 0.52 * s, z - 0.08 * s, 1.02 * s, 0.1 * s, 0.74 * s);
    bowl(cube, x + 0.92 * s, y + 0.2 * s, z + 0.42 * s, 0.36 * s, C.tealDark, C.curry);
  }
}

function plate(cube: CubeFn, x: number, y: number, z: number, s: number) {
  cube(C.ink, x, y + 0.08 * s, z, 2.28 * s, 0.14 * s, 1.58 * s);
  cube(C.cream, x, y + 0.2 * s, z, 2.04 * s, 0.14 * s, 1.34 * s);
  cube(C.teal, x, y + 0.29 * s, z, 1.72 * s, 0.08 * s, 1.04 * s);
  cube(C.cream, x, y + 0.35 * s, z, 1.42 * s, 0.08 * s, 0.8 * s);
}

function rice(cube: CubeFn, x: number, y: number, z: number, s: number) {
  cube(C.rice, x, y, z, 0.72 * s, 0.24 * s, 0.62 * s);
  cube(C.rice, x, y + 0.17 * s, z, 0.5 * s, 0.18 * s, 0.44 * s);
  cube(C.rice, x, y + 0.31 * s, z, 0.28 * s, 0.12 * s, 0.26 * s);
}

function chicken(cube: CubeFn, x: number, y: number, z: number, s: number) {
  for (let i = 0; i < 4; i++) {
    cube(C.chicken, x + (i - 1.5) * 0.18 * s, y + i * 0.012 * s, z, 0.15 * s, 0.1 * s, 0.68 * s);
    cube(C.chickenDark, x + (i - 1.5) * 0.18 * s, y + 0.08 * s + i * 0.012 * s, z - 0.32 * s, 0.15 * s, 0.05 * s, 0.08 * s);
  }
}

function bowl(cube: CubeFn, x: number, y: number, z: number, s: number, outer = C.teal, inner = C.blue) {
  cube(C.ink, x, y + 0.2 * s, z, 1.72 * s, 0.22 * s, 1.42 * s);
  cube(outer, x, y + 0.36 * s, z, 1.52 * s, 0.3 * s, 1.22 * s);
  cube(C.cream, x, y + 0.54 * s, z, 1.24 * s, 0.12 * s, 0.94 * s);
  cube(inner, x, y + 0.63 * s, z, 1.04 * s, 0.08 * s, 0.76 * s);
}

function poachPot(cube: CubeFn, poly: CubeFn, cyl: CubeFn, x: number, y: number, z: number) {
  cube(C.ink, x, y + 0.16, z, 2.45, 0.18, 1.8);
  cyl(C.ink, x, y + 0.32, z, 1.18, 0.22, 0.86);
  cyl(C.steel, x, y + 0.56, z, 1.04, 0.58, 0.76);
  cyl('#B9C7C2', x, y + 0.74, z, 0.92, 0.22, 0.64);
  cyl(C.broth, x, y + 0.9, z, 0.86, 0.08, 0.58);
  cyl('#DDF2DA', x - 0.06, y + 0.94, z - 0.02, 0.58, 0.04, 0.36);
  cube(C.ink, x - 1.08, y + 0.68, z, 0.16, 0.14, 0.34);
  cube(C.ink, x + 1.08, y + 0.68, z, 0.16, 0.14, 0.34);

  cyl(C.ink, x + 1.02, y + 1.08, z + 0.17, 0.055, 1.08, 0.055);
  cyl(C.cream, x + 1.02, y + 1.08, z + 0.17, 0.038, 1.0, 0.038);
  poly(C.red, x + 1.02, y + 0.5, z + 0.17, 0.09, 0.09, 0.09);

  const ginger = poly(C.prata, x - 0.48, y + 1.02, z - 0.28, 0.13, 0.04, 0.1);
  ginger.rotation.y = 0.35;
  const scallionA = cube(C.green, x + 0.46, y + 1.02, z - 0.28, 0.07, 0.05, 0.42);
  scallionA.rotation.y = 0.22;
  const scallionB = cube('#8ACF69', x + 0.62, y + 1.03, z - 0.22, 0.07, 0.05, 0.36);
  scallionB.rotation.y = -0.24;
}

function wholeChickenModel(cube: CubeFn, poly: CubeFn, cyl: CubeFn, x: number, y: number, z: number, s: number, dynamic = false) {
  const parts: THREE.Mesh[] = [];
  const add = (mesh: THREE.Mesh, rx = 0, ry = 0, rz = 0) => {
    mesh.rotation.set(rx, ry, rz);
    parts.push(dynamic ? remember(mesh) : mesh);
    return mesh;
  };

  add(poly(C.chickenDark, x, y - 0.08 * s, z + 0.04 * s, 0.82 * s, 0.12 * s, 1.02 * s));
  add(poly(C.chicken, x, y + 0.08 * s, z, 0.64 * s, 0.43 * s, 0.88 * s), 0.03, 0, 0);
  add(poly(C.chickenLight, x - 0.18 * s, y + 0.3 * s, z - 0.12 * s, 0.27 * s, 0.14 * s, 0.34 * s), 0.08, -0.08, -0.04);
  add(poly(C.chickenLight, x + 0.18 * s, y + 0.3 * s, z - 0.12 * s, 0.27 * s, 0.14 * s, 0.34 * s), 0.08, 0.08, 0.04);
  add(poly(C.chickenLight, x, y + 0.3 * s, z - 0.55 * s, 0.2 * s, 0.1 * s, 0.13 * s), 0.1, 0, 0);
  add(cube('#C98A57', x, y + 0.36 * s, z - 0.12 * s, 0.055 * s, 0.035 * s, 0.56 * s), 0, 0.02, 0);

  add(poly(C.chickenDark, x - 0.5 * s, y + 0.04 * s, z + 0.02 * s, 0.22 * s, 0.14 * s, 0.38 * s), 0.08, -0.5, -0.18);
  add(poly(C.chickenDark, x + 0.5 * s, y + 0.04 * s, z + 0.02 * s, 0.22 * s, 0.14 * s, 0.38 * s), 0.08, 0.5, 0.18);
  add(poly(C.chickenLight, x - 0.58 * s, y + 0.08 * s, z - 0.1 * s, 0.12 * s, 0.08 * s, 0.22 * s), 0.04, -0.54, -0.18);
  add(poly(C.chickenLight, x + 0.58 * s, y + 0.08 * s, z - 0.1 * s, 0.12 * s, 0.08 * s, 0.22 * s), 0.04, 0.54, 0.18);

  add(poly(C.chicken, x - 0.34 * s, y + 0.24 * s, z + 0.5 * s, 0.22 * s, 0.18 * s, 0.4 * s), 0.22, -0.24, -0.1);
  add(poly(C.chickenLight, x - 0.5 * s, y + 0.28 * s, z + 0.8 * s, 0.11 * s, 0.1 * s, 0.18 * s), 0.1, -0.18, -0.04);
  add(poly('#FFF1C8', x - 0.55 * s, y + 0.34 * s, z + 0.94 * s, 0.07 * s, 0.06 * s, 0.08 * s));
  add(poly(C.chicken, x + 0.34 * s, y + 0.24 * s, z + 0.5 * s, 0.22 * s, 0.18 * s, 0.4 * s), 0.22, 0.24, 0.1);
  add(poly(C.chickenLight, x + 0.5 * s, y + 0.28 * s, z + 0.8 * s, 0.11 * s, 0.1 * s, 0.18 * s), 0.1, 0.18, 0.04);
  add(poly('#FFF1C8', x + 0.55 * s, y + 0.34 * s, z + 0.94 * s, 0.07 * s, 0.06 * s, 0.08 * s));

  return parts;
}

function pot(cube: CubeFn, x: number, y: number, z: number, thermometer: boolean) {
  cube(C.ink, x, y + 0.18, z, 2.15, 0.2, 1.55);
  cube(C.steel, x, y + 0.44, z, 1.82, 0.58, 1.24);
  cube(C.blue, x, y + 0.82, z, 1.46, 0.1, 0.9);
  cube(C.steel, x - 1.18, y + 0.5, z, 0.32, 0.24, 0.72);
  cube(C.steel, x + 1.18, y + 0.5, z, 0.32, 0.24, 0.72);
  if (thermometer) {
    cube(C.ink, x + 1.45, y + 1.15, z, 0.12, 1.44, 0.12);
    cube(C.yellow, x + 1.45, y + 1.55, z, 0.36, 0.18, 0.22);
    cube(C.green, x + 1.45, y + 1.02, z, 0.22, 0.5, 0.18);
  }
}

function wok(cube: CubeFn, cyl: CubeFn, x: number, y: number, z: number) {
  cyl(C.ink, x, y + 0.2, z, 1.52, 0.16, 1.02);
  cyl(C.steel, x, y + 0.36, z, 1.34, 0.18, 0.86);
  cyl(C.ink, x, y + 0.55, z, 1.54, 0.18, 1.02);
  cyl(C.redDark, x, y + 0.68, z, 1.06, 0.08, 0.66);
  cyl(C.red, x - 0.14, y + 0.77, z + 0.04, 0.64, 0.05, 0.38);
  cube(C.ink, x - 1.5, y + 0.58, z, 0.64, 0.1, 0.14);
  cube(C.ink, x + 1.5, y + 0.58, z, 0.64, 0.1, 0.14);
  cube(C.ink, x - 1.28, y + 0.52, z, 0.2, 0.3, 0.2);
  cube(C.ink, x + 1.28, y + 0.52, z, 0.2, 0.3, 0.2);
}

function noodleBasket(cube: CubeFn, x: number, y: number, z: number) {
  pot(cube, x, y, z, false);
  cube(C.ink, x, y + 1.08, z, 1.4, 0.1, 1.0);
  for (let i = -3; i <= 3; i++) cube(C.noodle, x + i * 0.16, y + 1.16, z, 0.08, 0.08, 0.86);
}

function dough(cube: CubeFn, x: number, y: number, z: number, stretch: number) {
  cube(C.ink, x, y + 0.05, z, 2.4 * stretch, 0.16, 1.4);
  cube(C.prata, x, y + 0.24, z, 1.28 * stretch, 0.24, 0.86);
  cube(C.prataLight, x + 0.2, y + 0.44, z - 0.04, 0.75 * stretch, 0.1, 0.52);
}

type CubeFn = (color: string, x: number, y: number, z: number, sx?: number, sy?: number, sz?: number) => THREE.Mesh;
