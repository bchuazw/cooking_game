import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import type { DishId } from './gameData';

type Mode = 'menu' | 'cook' | 'result';

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
  sequenceIndex?: number;
  placedIds?: string[];
  dragId?: string | null;
  stirProgress?: number;
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
  ingredients?: Record<string, THREE.Mesh[]>;
  sizzle?: THREE.Mesh[];
  stirSpoon?: THREE.Mesh;
  noodleBasket?: THREE.Mesh;
  dough?: THREE.Mesh;
  foldCorners?: THREE.Mesh[];
  plateParts?: Record<string, THREE.Mesh[]>;
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
  steel: '#8FA1A6',
  rice: '#FAF3DA',
  chicken: '#D89960',
  chickenDark: '#9D5B38',
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
    renderer.setPixelRatio(Math.min(1.35, window.devicePixelRatio || 1));
    host.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0xffefc3, 18, 34);

    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 80);
    camera.position.set(7.2, mode === 'menu' ? 8.8 : 7.2, mode === 'cook' ? 9.2 : 10.5);
    camera.lookAt(0, 0.55, 0);

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
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      if (now - last < 1000 / 30) return;
      last = now;
      const t = now / 1000;
      root.rotation.y = Math.sin(t * 0.32) * (mode === 'menu' ? 0.055 : 0.035);
      root.position.y = Math.sin(t * 1.2) * 0.025;
      updateDynamics(dynamics, visualRef.current, t);
      renderer.render(scene, camera);
    };
    raf = requestAnimationFrame(tick);
    renderer.render(scene, camera);

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
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
  const materials = new Map<string, THREE.MeshStandardMaterial>();
  const meshes: THREE.Mesh[] = [];

  const material = (color: string) => {
    let existing = materials.get(color);
    if (!existing) {
      existing = new THREE.MeshStandardMaterial({
        color,
        roughness: 0.82,
        metalness: color === C.steel ? 0.08 : 0,
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

  floor(cube, mode === 'menu' ? 8 : 6);
  stall(cube, dishId, mode);

  let dynamics: DynamicMeshes = {};
  if (mode === 'menu') {
    dish(cube, 'chicken-rice', -3.35, 0, 0.4, 0.72);
    dish(cube, 'laksa', 0, 0, 0.25, 0.72);
    dish(cube, 'prata', 3.35, 0, 0.4, 0.72);
    tables(cube);
  } else if (mode === 'cook') {
    cookingProp(cube, dishId, stepId);
    dynamics = dynamicProp(cube, dishId, stepId);
  } else {
    dish(cube, dishId, 0, 0, 0.45, 1.26);
    cube(C.yellow, -1.3, 2.4, -1.8, 0.22, 0.22, 0.22);
    cube(C.yellow, 0, 2.72, -1.7, 0.26, 0.26, 0.26);
    cube(C.yellow, 1.3, 2.4, -1.8, 0.22, 0.22, 0.22);
  }

  return {
    dynamics,
    dispose: () => {
      meshes.forEach((mesh) => {
        root.remove(mesh);
      });
      box.dispose();
      materials.forEach((m) => m.dispose());
    },
  };
}

function dynamicProp(cube: CubeFn, dishId: DishId, stepId?: string): DynamicMeshes {
  const dynamics: DynamicMeshes = {};
  if (dishId === 'chicken-rice' && stepId === 'poach') {
    dynamics.poachMercury = cube(C.red, 1.45, 0.72, 0.55, 0.14, 0.32, 0.14);
    dynamics.poachHandle = cube(C.yellow, 1.45, 1.1, 0.55, 0.46, 0.16, 0.28);
    dynamics.poachSteam = [
      cube(C.cream, -0.55, 1.16, 0.42, 0.08, 0.25, 0.08),
      cube(C.cream, 0.05, 1.26, 0.5, 0.08, 0.25, 0.08),
      cube(C.cream, 0.62, 1.12, 0.42, 0.08, 0.25, 0.08),
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
      const parts = ingredientVoxels(cube, id, color, -0.54 + i * 0.36, 1.86, 0.9 + (i % 2) * 0.1, 1.28);
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
        remember(cube(C.rice, -0.36, 0.82, 0.42, 0.72, 0.24, 0.58)),
        remember(cube(C.rice, -0.36, 1, 0.42, 0.5, 0.16, 0.42)),
        remember(cube(C.cream, -0.36, 1.12, 0.42, 0.24, 0.08, 0.22)),
      ],
      chicken: [-0.24, -0.08, 0.08, 0.24].flatMap((offset, i) => [
        remember(cube(C.chicken, 0.46 + offset, 0.92 + i * 0.018, 0.36, 0.14, 0.1, 0.62)),
        remember(cube(C.chickenDark, 0.46 + offset, 1 + i * 0.018, 0.05, 0.14, 0.05, 0.08)),
      ]),
      sauce: [
        remember(cube(C.redDark, 0.8, 0.88, 0.85, 0.38, 0.14, 0.3)),
        remember(cube(C.red, 0.8, 0.98, 0.85, 0.28, 0.08, 0.2)),
      ],
    };
    Object.values(dynamics.plateParts).flat().forEach((mesh) => { mesh.visible = false; });
  }

  return dynamics;
}

function ingredientVoxels(cube: CubeFn, id: string, color: string, x: number, y: number, z: number, s = 1) {
  const parts: THREE.Mesh[] = [];
  const add = (partColor: string, px: number, py: number, pz: number, sx: number, sy: number, sz: number) => {
    parts.push(remember(cube(partColor, x + px * s, y + py * s, z + pz * s, sx * s, sy * s, sz * s)));
  };

  if (id === 'shallot') {
    add(color, 0, 0, 0, 0.22, 0.18, 0.22);
    add('#D77AA3', -0.08, 0.16, 0.02, 0.14, 0.12, 0.14);
    add(C.cream, 0.08, 0.13, -0.03, 0.08, 0.08, 0.1);
  } else if (id === 'garlic') {
    add(C.cream, -0.09, 0, 0.02, 0.16, 0.12, 0.14);
    add('#F3DC8B', 0.07, 0.03, -0.03, 0.15, 0.12, 0.15);
    add(C.cream, 0.16, 0.11, 0.04, 0.1, 0.08, 0.1);
  } else if (id === 'ginger') {
    add(color, -0.08, 0, 0, 0.24, 0.14, 0.18);
    add('#F2B65C', 0.12, 0.07, 0.02, 0.2, 0.12, 0.16);
    add('#AD6A2C', -0.18, 0.1, 0.05, 0.08, 0.06, 0.08);
  } else if (id === 'pandan') {
    add(C.green, -0.16, 0, -0.02, 0.08, 0.08, 0.5);
    add('#2F7F3A', 0, 0.05, 0.04, 0.08, 0.08, 0.54);
    add('#8ACF69', 0.16, 0.02, -0.05, 0.08, 0.08, 0.48);
  } else if (id === 'stock') {
    add(C.blue, -0.1, 0.02, 0, 0.2, 0.16, 0.2);
    add('#B9DDF2', 0.1, 0.08, 0, 0.12, 0.1, 0.12);
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
  mesh.userData.base = {
    x: mesh.position.x,
    y: mesh.position.y,
    z: mesh.position.z,
    sx: mesh.scale.x,
    sy: mesh.scale.y,
    sz: mesh.scale.z,
  };
  return mesh;
}

function baseFor(mesh: THREE.Mesh) {
  return mesh.userData.base as { x: number; y: number; z: number; sx: number; sy: number; sz: number };
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
  dynamics.poachSteam?.forEach((mesh, i) => {
    const heat = state.inZone ? 0.25 : 0.08;
    mesh.visible = true;
    mesh.position.y = 1.04 + ((t * (0.7 + heat) + i * 0.3) % 1.15);
    mesh.position.x += Math.sin(t * 1.7 + i) * 0.0008;
  });

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
    const angle = t * 2 + progress * Math.PI * 8;
    const radius = 0.62;
    dynamics.stirSpoon.position.x = Math.cos(angle) * radius;
    dynamics.stirSpoon.position.z = 0.75 + Math.sin(angle) * radius * 0.58;
    dynamics.stirSpoon.rotation.z = angle;
    dynamics.stirSpoon.position.y = 0.9 + Math.sin(t * 8) * 0.04;
  }

  if (dynamics.noodleBasket) {
    const progress = state.holdProgress ?? 0;
    dynamics.noodleBasket.position.y = 1.24 - Math.min(progress, 1) * 0.48;
    dynamics.noodleBasket.rotation.z = state.inZone ? Math.sin(t * 8) * 0.035 : 0;
  }

  if (dynamics.dough) {
    const progress = state.swipeProgress ?? 0;
    const drag = state.swipeDrag ?? 0;
    dynamics.dough.scale.x = 1.1 + progress * 1.15 + Math.abs(drag) * 0.42;
    dynamics.dough.scale.z = 0.72 - progress * 0.16 - Math.abs(drag) * 0.08;
    dynamics.dough.position.x = drag * 0.22;
    dynamics.dough.position.y = 0.52 + Math.sin(t * 8) * 0.025;
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
  const z = -5.2;
  cube(C.ink, 0, 1.18, z, 7.25, 0.28, 0.36);
  cube(C.cream, 0, 1.48, z, 6.8, 0.62, 0.48);
  cube(accent[dishId], 0, 1.98, z, 7.3, 0.54, 0.78);
  for (let x = -3; x <= 3; x++) cube(x % 2 ? C.cream : accent[dishId], x, 2.38, z + 0.22, 0.92, 0.36, 0.68);
  cube(C.ink, -3.45, 0.76, z + 0.08, 0.22, 1.18, 0.28);
  cube(C.ink, 3.45, 0.76, z + 0.08, 0.22, 1.18, 0.28);
  for (let x = -4.5; x <= 4.5; x += 1.5) cube(C.yellow, x, 3, z + 0.4, 0.2, 0.2, 0.2);

  if (mode !== 'menu') {
    cube(C.ink, 0, 0.12, -2.62, 6.5, 0.24, 1.15);
    cube(C.steel, -2.7, 0.36, -2.72, 1.7, 0.56, 1.05);
    cube(C.steel, 2.7, 0.36, -2.72, 1.7, 0.56, 1.05);
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

function cookingProp(cube: CubeFn, dishId: DishId, stepId?: string) {
  if (dishId === 'chicken-rice') {
    if (stepId === 'poach') pot(cube, 0, 0, 0.55, true);
    else if (stepId === 'aromatics') {
      wok(cube, 0, 0.16, 0.22);
      ingredientVoxels(cube, 'shallot', '#B34779', -1.55, 0.86, 0.84, 0.95);
      ingredientVoxels(cube, 'garlic', C.cream, -0.55, 0.86, 0.96, 0.95);
      ingredientVoxels(cube, 'ginger', C.prata, 0.48, 0.86, 0.96, 0.95);
      ingredientVoxels(cube, 'pandan', C.green, 1.42, 0.86, 0.84, 0.95);
    } else if (stepId === 'plate') {
      plate(cube, 0, 0, 0.4, 1.12);
    } else dish(cube, dishId, 0, 0, 0.4, 1.12);
  } else if (dishId === 'laksa') {
    if (stepId === 'rempah') wok(cube, 0, 0, 0.8);
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

function wok(cube: CubeFn, x: number, y: number, z: number) {
  cube(C.ink, x, y + 0.2, z, 2.25, 0.26, 1.55);
  cube(C.steel, x, y + 0.38, z, 1.86, 0.32, 1.18);
  cube(C.redDark, x, y + 0.58, z, 1.48, 0.12, 0.84);
  cube(C.red, x - 0.25, y + 0.7, z + 0.1, 0.66, 0.1, 0.44);
  cube(C.ink, x - 1.34, y + 0.36, z, 0.7, 0.12, 0.16);
  cube(C.ink, x + 1.34, y + 0.36, z, 0.7, 0.12, 0.16);
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
