import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import type { DishId } from './gameData';

type Mode = 'menu' | 'cook' | 'result';

interface VoxelCanvasProps {
  mode: Mode;
  dishId?: DishId;
  stepId?: string;
  dim?: boolean;
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

export function VoxelCanvas({ mode, dishId = 'chicken-rice', stepId, dim = false }: VoxelCanvasProps) {
  const hostRef = useRef<HTMLDivElement>(null);

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
    const dispose = buildScene(root, mode, dishId, stepId);

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

function buildScene(root: THREE.Group, mode: Mode, dishId: DishId, stepId?: string) {
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
  };

  floor(cube, mode === 'menu' ? 8 : 6);
  stall(cube, dishId, mode);

  if (mode === 'menu') {
    dish(cube, 'chicken-rice', -3.35, 0, 0.4, 0.72);
    dish(cube, 'laksa', 0, 0, 0.25, 0.72);
    dish(cube, 'prata', 3.35, 0, 0.4, 0.72);
    tables(cube);
  } else if (mode === 'cook') {
    cookingProp(cube, dishId, stepId);
  } else {
    dish(cube, dishId, 0, 0, 0.45, 1.26);
    cube(C.yellow, -1.3, 2.4, -1.8, 0.22, 0.22, 0.22);
    cube(C.yellow, 0, 2.72, -1.7, 0.26, 0.26, 0.26);
    cube(C.yellow, 1.3, 2.4, -1.8, 0.22, 0.22, 0.22);
  }

  return () => {
    meshes.forEach((mesh) => {
      root.remove(mesh);
    });
    box.dispose();
    materials.forEach((m) => m.dispose());
  };
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
      wok(cube, 0, 0, 0.75);
      cube(C.yellow, -1.45, 0.72, 1.25, 0.38, 0.16, 0.32);
      cube(C.cream, -0.5, 0.72, 1.42, 0.34, 0.16, 0.34);
      cube(C.prata, 0.52, 0.72, 1.42, 0.38, 0.16, 0.34);
      cube(C.green, 1.45, 0.72, 1.26, 0.18, 0.16, 0.68);
    } else dish(cube, dishId, 0, 0, 0.4, 1.12);
  } else if (dishId === 'laksa') {
    if (stepId === 'rempah') wok(cube, 0, 0, 0.8);
    else if (stepId === 'noodles') noodleBasket(cube, 0, 0, 0.55);
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

type CubeFn = (color: string, x: number, y: number, z: number, sx?: number, sy?: number, sz?: number) => void;
