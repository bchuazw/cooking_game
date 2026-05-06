import type { FoodKind } from './FoodIllustrations';

export type PixelFoodKind = FoodKind | 'chicken' | 'rice' | 'wok' | 'pot' | 'thermometer';

type Rect = readonly [number, number, number, number, string];

const P = {
  ink: '#2a1a18',
  hi: '#fff7d7',
  rice: '#f7e8bb',
  rice2: '#d8bb73',
  chicken: '#f0bd82',
  skin: '#f6d77d',
  green: '#56a34a',
  green2: '#2d6b39',
  teal: '#2ba59d',
  red: '#d8432b',
  red2: '#9f2e24',
  orange: '#e8893f',
  yellow: '#f1c84c',
  purple: '#a958a5',
  cream: '#f4dfb2',
  tan: '#c98853',
  brown: '#7a4a2a',
  dark: '#26343d',
  steel: '#9fa7a5',
  steel2: '#667075',
  soup: '#d86c36',
  pink: '#f29b84',
  white: '#fffef0',
};

const sprites: Record<PixelFoodKind, Rect[]> = {
  chicken: [
    [3, 5, 10, 7, P.ink], [4, 4, 8, 2, P.skin], [4, 6, 9, 5, P.chicken], [5, 6, 7, 1, P.hi], [6, 10, 4, 1, P.brown],
  ],
  chickenSlice: [
    [2, 6, 12, 5, P.ink], [3, 5, 10, 2, P.skin], [3, 7, 10, 3, P.chicken], [5, 7, 7, 1, P.hi],
  ],
  rice: [
    [2, 6, 12, 6, P.ink], [3, 5, 10, 7, P.rice], [5, 4, 6, 2, P.hi], [4, 8, 1, 1, P.rice2], [8, 7, 1, 1, P.rice2], [11, 9, 1, 1, P.rice2],
  ],
  cucumber: [
    [4, 4, 8, 8, P.ink], [5, 4, 6, 8, P.green2], [5, 5, 6, 6, '#cce59a'], [7, 7, 1, 1, P.green], [9, 7, 1, 1, P.green], [8, 9, 1, 1, P.green],
  ],
  coriander: [
    [7, 2, 2, 12, P.green2], [4, 5, 4, 3, P.green], [8, 4, 5, 4, P.green], [5, 9, 4, 3, P.green], [9, 9, 3, 3, P.green],
  ],
  laksaLeaf: [
    [7, 2, 2, 12, P.green2], [4, 4, 3, 8, P.green], [9, 4, 3, 8, P.green], [6, 3, 4, 9, '#74bd59'],
  ],
  pandan: [
    [7, 2, 2, 12, P.green2], [4, 3, 3, 11, P.green], [9, 3, 3, 11, P.green], [6, 5, 4, 8, '#75bd5b'],
  ],
  shallot: [
    [4, 3, 8, 10, P.ink], [5, 4, 6, 8, P.purple], [7, 2, 2, 2, P.green], [6, 5, 1, 6, '#e29bdc'], [10, 5, 1, 6, '#70356d'],
  ],
  garlic: [
    [3, 5, 10, 7, P.ink], [4, 5, 4, 6, P.cream], [8, 4, 4, 7, P.hi], [6, 4, 4, 2, P.cream], [6, 10, 5, 1, '#b58d58'],
  ],
  ginger: [
    [3, 6, 10, 6, P.ink], [4, 5, 7, 6, P.tan], [6, 4, 4, 3, '#dca66b'], [5, 8, 6, 1, '#9c663a'],
  ],
  stock: [
    [3, 4, 10, 9, P.ink], [4, 5, 8, 6, P.steel], [5, 6, 6, 3, '#86c5df'], [5, 10, 6, 1, P.steel2],
  ],
  coconut: [
    [4, 4, 8, 9, P.ink], [5, 5, 6, 7, P.white], [6, 5, 4, 2, P.hi], [7, 8, 3, 3, '#dce8e0'],
  ],
  taupok: [
    [3, 4, 10, 9, P.ink], [4, 5, 4, 4, P.yellow], [9, 5, 3, 3, '#f7da75'], [6, 10, 5, 2, '#d79a35'],
  ],
  noodle: [
    [2, 5, 12, 7, P.ink], [3, 6, 10, 1, P.yellow], [3, 8, 10, 1, P.yellow], [3, 10, 10, 1, P.yellow], [5, 5, 1, 7, '#fff2a5'], [10, 5, 1, 7, '#fff2a5'],
  ],
  prawn: [
    [3, 5, 10, 7, P.ink], [4, 5, 7, 6, P.orange], [10, 7, 3, 3, P.pink], [5, 6, 5, 1, P.hi], [3, 10, 3, 2, P.red2],
  ],
  fishcake: [
    [3, 5, 10, 7, P.ink], [4, 6, 8, 5, P.white], [5, 6, 6, 1, P.pink], [8, 8, 3, 1, P.pink],
  ],
  sprouts: [
    [3, 10, 10, 2, P.ink], [4, 6, 1, 5, P.white], [7, 5, 1, 6, P.white], [10, 6, 1, 5, P.white], [4, 5, 2, 1, P.green], [10, 5, 2, 1, P.green],
  ],
  sambal: [
    [3, 6, 10, 6, P.ink], [4, 7, 8, 4, P.red], [5, 6, 6, 1, P.orange], [6, 9, 1, 1, P.yellow], [9, 8, 1, 1, P.yellow],
  ],
  doughBall: [
    [3, 4, 10, 9, P.ink], [4, 5, 8, 7, '#e8b674'], [6, 5, 5, 2, '#f5d795'], [5, 9, 7, 1, P.brown],
  ],
  doughSheet: [
    [2, 5, 12, 7, P.ink], [3, 6, 10, 5, '#e8b674'], [4, 6, 8, 1, '#f7dc9a'], [5, 9, 7, 1, P.brown],
  ],
  prata: [
    [2, 6, 12, 6, P.ink], [3, 6, 10, 5, '#d79a48'], [5, 5, 5, 2, '#f4c36d'], [5, 9, 6, 1, P.brown],
  ],
  crab: [
    [2, 7, 12, 5, P.ink], [4, 5, 8, 7, P.red], [5, 4, 2, 2, P.ink], [10, 4, 2, 2, P.ink], [2, 5, 3, 3, P.red2], [11, 5, 3, 3, P.red2], [4, 12, 2, 2, P.red2], [10, 12, 2, 2, P.red2],
  ],
  mantou: [
    [3, 5, 10, 7, P.ink], [4, 5, 8, 6, P.white], [5, 5, 6, 2, P.hi], [5, 9, 6, 1, '#ded0aa'],
  ],
  toast: [
    [3, 3, 10, 10, P.ink], [4, 4, 8, 8, '#d99045'], [5, 4, 6, 2, '#f0c071'], [5, 8, 6, 1, P.brown],
  ],
  kayaToast: [
    [2, 4, 12, 9, P.ink], [3, 4, 10, 3, '#d99045'], [3, 8, 10, 2, '#8f6a24'], [3, 10, 10, 2, '#d99045'], [6, 8, 4, 1, '#c09a39'],
  ],
  egg: [
    [4, 3, 8, 10, P.ink], [5, 4, 6, 8, P.white], [6, 5, 4, 2, P.hi],
  ],
  crackedEgg: [
    [2, 8, 12, 5, P.ink], [3, 8, 5, 4, P.white], [8, 8, 5, 4, P.white], [7, 10, 2, 2, P.yellow], [7, 7, 1, 2, P.ink], [9, 7, 1, 2, P.ink],
  ],
  kopiCup: [
    [4, 5, 9, 8, P.ink], [5, 6, 6, 6, P.white], [5, 6, 6, 2, P.brown], [11, 7, 3, 3, P.ink], [12, 8, 1, 1, P.hi],
  ],
  pot: [
    [2, 6, 12, 8, P.ink], [3, 7, 10, 6, P.steel], [4, 6, 8, 2, P.steel2], [5, 7, 6, 1, '#d1d4c9'], [1, 8, 2, 2, P.ink], [13, 8, 2, 2, P.ink],
  ],
  wok: [
    [1, 6, 14, 7, P.ink], [3, 7, 10, 5, P.dark], [5, 7, 6, 2, '#485663'], [2, 5, 2, 2, P.ink], [12, 5, 2, 2, P.ink],
  ],
  thermometer: [
    [7, 2, 3, 11, P.ink], [8, 3, 1, 8, P.hi], [8, 8, 1, 4, P.red], [6, 12, 5, 3, P.ink], [7, 12, 3, 2, P.red],
  ],
};

export function PixelIcon({
  kind,
  x = 0,
  y = 0,
  size = 32,
  opacity = 1,
}: {
  kind: PixelFoodKind;
  x?: number;
  y?: number;
  size?: number;
  opacity?: number;
}) {
  const rects = sprites[kind] ?? sprites.sambal;
  const scale = size / 16;
  return (
    <g transform={`translate(${x}, ${y}) scale(${scale})`} opacity={opacity} shapeRendering="crispEdges">
      {rects.map(([rx, ry, rw, rh, c], i) => (
        <rect key={`${kind}-${i}`} x={rx} y={ry} width={rw} height={rh} fill={c} />
      ))}
    </g>
  );
}

export function PixelIconSvg({
  kind,
  size = 64,
  title,
  className = '',
}: {
  kind: PixelFoodKind;
  size?: number;
  title?: string;
  className?: string;
}) {
  const rects = sprites[kind] ?? sprites.sambal;
  return (
    <svg
      viewBox="0 0 16 16"
      width={size}
      height={size}
      className={`pixel-art ${className}`}
      shapeRendering="crispEdges"
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      {rects.map(([x, y, w, h, c], i) => (
        <rect key={`${kind}-${i}`} x={x} y={y} width={w} height={h} fill={c} />
      ))}
    </svg>
  );
}
