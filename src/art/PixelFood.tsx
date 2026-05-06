import type { FoodKind } from './FoodIllustrations';

export type PixelFoodKind =
  | FoodKind
  | 'chicken'
  | 'wholeChicken'
  | 'iceBowl'
  | 'mortar'
  | 'pestle'
  | 'rice'
  | 'wok'
  | 'pot'
  | 'thermometer';

type Rect = readonly [number, number, number, number, string];

const P = {
  ink: '#2a1a18',
  line: '#5a3826',
  hi: '#fff7d7',
  white: '#fffef0',
  cream: '#f4dfb2',
  rice: '#f7e8bb',
  rice2: '#d8bb73',
  chicken: '#efbd82',
  chicken2: '#cf8b58',
  skin: '#f6d77d',
  green: '#62b957',
  green2: '#2d6b39',
  teal: '#2ba59d',
  red: '#d8432b',
  red2: '#9f2e24',
  orange: '#e8893f',
  yellow: '#f1c84c',
  purple: '#a958a5',
  tan: '#c98853',
  brown: '#7a4a2a',
  dark: '#26343d',
  steel: '#9fa7a5',
  steel2: '#667075',
  soup: '#d86c36',
  pink: '#f29b84',
  ice: '#bfeaff',
  ice2: '#7bc9e4',
};

const shadow: Rect[] = [[5, 27, 22, 3, 'rgba(42,26,24,0.2)']];
const shine = '#fff7d799';

const sprites: Record<PixelFoodKind, Rect[]> = {
  chicken: [
    ...shadow,
    [5, 13, 22, 10, P.ink], [6, 11, 17, 4, P.ink], [7, 10, 15, 3, P.skin],
    [6, 14, 20, 8, P.chicken], [8, 15, 15, 2, P.hi], [8, 20, 13, 2, P.chicken2],
    [4, 18, 5, 4, P.chicken], [22, 17, 5, 4, P.chicken], [12, 23, 7, 2, P.brown],
  ],
  wholeChicken: [
    ...shadow,
    [9, 6, 14, 3, P.ink], [7, 8, 20, 4, P.ink], [5, 11, 24, 8, P.ink],
    [7, 19, 19, 5, P.ink], [3, 14, 7, 7, P.ink], [23, 14, 7, 7, P.ink],
    [10, 7, 12, 3, P.skin], [8, 9, 17, 4, '#ffe09d'], [7, 12, 20, 7, P.chicken],
    [8, 19, 17, 4, P.chicken2], [4, 15, 6, 5, P.chicken], [23, 15, 6, 5, P.chicken],
    [10, 13, 15, 2, P.hi], [11, 17, 13, 2, '#ffd49d'], [12, 21, 10, 2, P.brown],
    [7, 18, 3, 3, '#d89a63'], [23, 18, 3, 3, '#d89a63'], [18, 8, 2, 2, '#fff0aa'],
    [23, 11, 2, 2, '#fff0aa'], [11, 8, 2, 2, '#fff5c4'],
  ],
  chickenSlice: [
    ...shadow,
    [3, 13, 26, 10, P.ink], [5, 11, 22, 5, P.ink], [5, 12, 22, 4, P.skin],
    [4, 16, 24, 6, P.chicken], [7, 16, 18, 2, P.hi], [8, 20, 16, 2, P.chicken2],
    [12, 18, 2, 4, '#b87345'], [20, 17, 2, 4, '#b87345'],
  ],
  rice: [
    ...shadow,
    [4, 14, 24, 10, P.ink], [6, 11, 20, 14, P.rice], [9, 9, 14, 5, P.hi],
    [8, 16, 2, 2, P.rice2], [13, 15, 2, 1, P.rice2], [18, 17, 2, 2, P.rice2],
    [22, 19, 1, 2, P.rice2], [11, 21, 2, 1, P.rice2], [16, 12, 1, 1, P.rice2],
  ],
  cucumber: [
    ...shadow,
    [6, 6, 20, 20, P.ink], [7, 6, 18, 20, P.green2], [9, 8, 14, 16, '#cce59a'],
    [11, 10, 10, 12, '#e9f6b8'], [13, 12, 2, 3, P.green], [18, 12, 2, 3, P.green],
    [15, 17, 2, 3, P.green], [11, 18, 2, 2, P.green], [20, 18, 2, 2, P.green],
  ],
  coriander: [
    ...shadow,
    [15, 6, 3, 21, P.green2], [8, 10, 8, 6, P.green], [17, 8, 9, 7, P.green],
    [6, 16, 9, 6, P.green], [17, 17, 8, 7, P.green], [10, 8, 5, 4, '#87d86b'],
    [19, 10, 5, 3, '#87d86b'], [9, 18, 4, 2, '#87d86b'],
  ],
  laksaLeaf: [
    ...shadow,
    [15, 5, 3, 23, P.green2], [9, 7, 7, 18, P.green], [18, 7, 7, 18, P.green],
    [12, 5, 8, 21, '#75bd5b'], [15, 7, 1, 17, '#d4f0bd'], [19, 10, 1, 12, '#d4f0bd'],
  ],
  pandan: [
    ...shadow,
    [15, 4, 3, 24, P.green2], [8, 6, 7, 21, P.green], [18, 5, 7, 22, P.green],
    [11, 4, 7, 22, '#75bd5b'], [14, 7, 1, 17, '#d4f0bd'], [21, 8, 1, 16, '#d4f0bd'],
  ],
  shallot: [
    ...shadow,
    [8, 8, 16, 18, P.ink], [9, 7, 14, 18, P.purple], [12, 4, 7, 5, P.green2],
    [13, 8, 2, 16, '#e29bdc'], [18, 8, 2, 16, '#70356d'], [10, 14, 12, 2, '#cc7cc4'],
    [11, 22, 10, 2, '#6e386e'],
  ],
  garlic: [
    ...shadow,
    [5, 13, 22, 12, P.ink], [6, 12, 9, 12, P.cream], [14, 10, 9, 14, P.white],
    [21, 13, 6, 10, P.cream], [10, 8, 12, 5, P.cream], [13, 7, 6, 3, P.green2],
    [10, 14, 2, 9, '#c9b78d'], [18, 13, 2, 10, '#c9b78d'], [13, 22, 10, 2, '#b58d58'],
  ],
  ginger: [
    ...shadow,
    [5, 14, 22, 10, P.ink], [7, 12, 17, 11, P.tan], [11, 9, 9, 6, '#dca66b'],
    [18, 13, 8, 7, '#dca66b'], [9, 17, 14, 2, '#9c663a'], [12, 13, 8, 2, '#f0bd82'],
    [6, 20, 12, 2, '#9c663a'], [22, 17, 3, 2, '#9c663a'],
  ],
  stock: [
    ...shadow,
    [7, 9, 18, 18, P.ink], [8, 10, 16, 14, P.steel], [10, 12, 12, 7, '#86c5df'],
    [10, 20, 12, 2, P.steel2], [12, 13, 8, 2, '#d6f7ff'], [9, 5, 14, 5, P.ink],
    [11, 4, 10, 4, P.steel2],
  ],
  coconut: [
    ...shadow,
    [7, 8, 18, 18, P.ink], [8, 9, 16, 16, '#6b4028'], [10, 10, 12, 13, P.white],
    [11, 10, 10, 4, P.hi], [13, 16, 6, 6, '#dce8e0'], [12, 15, 2, 2, '#9f8d75'],
    [18, 15, 2, 2, '#9f8d75'], [15, 20, 2, 2, '#9f8d75'],
  ],
  taupok: [
    ...shadow,
    [6, 8, 20, 18, P.ink], [7, 9, 18, 15, '#d9a23d'], [9, 10, 8, 8, P.yellow],
    [18, 10, 6, 6, '#f7da75'], [11, 20, 11, 3, '#a66a28'], [12, 13, 2, 2, '#b7772c'],
    [21, 17, 2, 2, '#b7772c'],
  ],
  noodle: [
    ...shadow,
    [4, 11, 24, 14, P.ink], [6, 12, 20, 3, P.yellow], [6, 16, 20, 3, P.yellow],
    [6, 20, 20, 3, P.yellow], [9, 11, 2, 14, '#fff2a5'], [15, 11, 2, 14, '#fff2a5'],
    [21, 11, 2, 14, '#fff2a5'], [7, 15, 18, 1, P.brown], [7, 19, 18, 1, P.brown],
  ],
  prawn: [
    ...shadow,
    [5, 12, 22, 12, P.ink], [7, 11, 16, 11, P.orange], [21, 14, 6, 6, P.pink],
    [9, 13, 11, 2, P.hi], [8, 17, 10, 2, '#a93521'], [5, 21, 7, 3, P.red2],
    [24, 9, 2, 9, P.ink], [26, 8, 2, 6, P.red2], [10, 10, 2, 2, P.ink],
  ],
  fishcake: [
    ...shadow,
    [5, 11, 22, 13, P.ink], [7, 12, 18, 10, P.white], [8, 12, 16, 3, P.pink],
    [10, 17, 12, 2, P.pink], [8, 20, 15, 1, '#ded0aa'], [11, 14, 2, 2, shine],
  ],
  sprouts: [
    ...shadow,
    [5, 22, 22, 3, P.ink], [7, 11, 2, 12, P.white], [12, 9, 2, 14, P.white],
    [17, 10, 2, 13, P.white], [22, 12, 2, 11, P.white], [6, 9, 5, 2, P.green],
    [11, 7, 5, 2, P.green], [21, 10, 5, 2, P.green], [16, 9, 4, 2, P.green],
  ],
  sambal: [
    ...shadow,
    [5, 13, 22, 12, P.ink], [7, 14, 18, 9, P.red], [9, 13, 14, 3, P.orange],
    [10, 18, 2, 2, P.yellow], [16, 17, 2, 2, P.yellow], [21, 19, 2, 2, P.red2],
    [8, 21, 14, 2, P.red2],
  ],
  doughBall: [
    ...shadow,
    [6, 9, 20, 17, P.ink], [7, 10, 18, 14, '#e8b674'], [10, 10, 11, 4, '#f5d795'],
    [9, 18, 15, 2, P.brown], [11, 22, 11, 2, '#9a6632'], [7, 14, 3, 5, '#f1c98a'],
  ],
  doughSheet: [
    ...shadow,
    [3, 11, 26, 13, P.ink], [5, 12, 22, 10, '#e8b674'], [7, 12, 18, 3, '#f7dc9a'],
    [9, 18, 15, 2, P.brown], [6, 20, 5, 2, '#bc7c3b'], [21, 16, 4, 2, '#bc7c3b'],
  ],
  prata: [
    ...shadow,
    [4, 12, 24, 13, P.ink], [6, 12, 20, 11, '#d79a48'], [9, 11, 12, 5, '#f4c36d'],
    [9, 18, 15, 2, P.brown], [14, 14, 3, 2, '#ffe09d'], [20, 20, 3, 2, '#9f5c2b'],
  ],
  crab: [
    ...shadow,
    [5, 13, 22, 11, P.ink], [8, 9, 16, 14, P.red], [11, 7, 4, 4, P.ink],
    [18, 7, 4, 4, P.ink], [4, 10, 7, 7, P.red2], [22, 10, 7, 7, P.red2],
    [3, 6, 6, 5, P.ink], [24, 6, 6, 5, P.ink], [5, 5, 4, 5, P.red], [24, 5, 4, 5, P.red],
    [8, 23, 4, 4, P.red2], [20, 23, 4, 4, P.red2], [11, 12, 10, 2, '#ff8a64'],
    [12, 16, 2, 2, P.ink], [19, 16, 2, 2, P.ink],
  ],
  mantou: [
    ...shadow,
    [6, 11, 20, 13, P.ink], [8, 10, 16, 12, P.white], [10, 10, 12, 5, P.hi],
    [10, 18, 12, 2, '#ded0aa'], [12, 13, 8, 2, '#fff8db'], [7, 21, 17, 2, '#c9b78d'],
  ],
  toast: [
    ...shadow,
    [6, 6, 20, 21, P.ink], [7, 7, 18, 18, '#d99045'], [9, 8, 14, 6, '#f0c071'],
    [10, 15, 12, 2, '#b86b34'], [10, 20, 12, 2, P.brown], [7, 7, 3, 18, '#8f572c'],
  ],
  kayaToast: [
    ...shadow,
    [5, 7, 22, 20, P.ink], [7, 8, 18, 7, '#d99045'], [7, 16, 18, 4, '#8f6a24'],
    [7, 21, 18, 4, '#d99045'], [10, 16, 12, 2, '#c09a39'], [9, 9, 14, 3, '#f0c071'],
  ],
  egg: [
    ...shadow,
    [8, 5, 16, 22, P.ink], [9, 6, 14, 20, P.white], [11, 8, 10, 5, P.hi],
    [12, 18, 8, 5, '#eee1c8'], [13, 10, 2, 2, '#ffffff'],
  ],
  crackedEgg: [
    ...shadow,
    [4, 15, 24, 10, P.ink], [6, 15, 10, 8, P.white], [16, 15, 10, 8, P.white],
    [13, 18, 6, 5, P.yellow], [14, 14, 2, 4, P.ink], [18, 14, 2, 4, P.ink],
    [7, 18, 6, 2, '#ffffff'], [20, 18, 4, 2, '#ffffff'],
  ],
  kopiCup: [
    ...shadow,
    [7, 10, 18, 17, P.ink], [9, 12, 12, 13, P.white], [9, 12, 12, 4, P.brown],
    [22, 14, 6, 7, P.ink], [24, 16, 2, 3, P.hi], [10, 16, 10, 2, '#d8432b'],
    [11, 11, 9, 2, '#fff7d7'], [12, 7, 2, 5, '#fff7d799'], [17, 6, 2, 5, '#fff7d799'],
  ],
  pot: [
    ...shadow,
    [4, 12, 24, 15, P.ink], [6, 14, 20, 12, P.steel], [8, 12, 16, 5, P.steel2],
    [10, 13, 12, 2, '#d1d4c9'], [1, 16, 5, 5, P.ink], [26, 16, 5, 5, P.ink],
    [8, 18, 3, 7, '#c7cfcc'], [20, 18, 2, 7, '#667075'], [9, 6, 2, 6, '#fff7d799'],
    [15, 4, 2, 7, '#fff7d799'], [21, 6, 2, 6, '#fff7d799'],
  ],
  wok: [
    ...shadow,
    [2, 13, 28, 14, P.ink], [5, 15, 22, 10, P.dark], [8, 15, 16, 4, '#485663'],
    [0, 12, 6, 5, P.ink], [26, 12, 6, 5, P.ink], [9, 20, 14, 2, '#17110e'],
    [12, 17, 8, 2, '#667075'],
  ],
  iceBowl: [
    ...shadow,
    [4, 15, 24, 12, P.ink], [6, 15, 20, 9, P.ice], [7, 22, 18, 3, P.ice2],
    [5, 11, 22, 5, P.ink], [7, 10, 18, 4, '#e9fbff'], [8, 13, 5, 5, P.white],
    [15, 12, 5, 5, '#e9fbff'], [22, 14, 4, 4, P.white], [9, 19, 2, 2, '#7bd1ef'],
    [14, 20, 2, 2, '#ffffff'], [21, 19, 2, 2, '#ffffff'],
  ],
  mortar: [
    ...shadow,
    [4, 14, 24, 13, P.ink], [6, 16, 20, 10, '#756150'], [8, 14, 16, 5, '#9a8875'],
    [10, 20, 12, 3, '#5b4b40'], [9, 18, 14, 2, P.red], [12, 17, 8, 2, '#ff9b7c'],
  ],
  pestle: [
    [14, 2, 6, 26, P.ink], [15, 4, 4, 20, '#6b5a50'], [14, 4, 6, 5, '#8b7a6a'],
    [12, 24, 10, 5, P.ink], [15, 5, 1, 16, '#b6a28b'],
  ],
  thermometer: [
    [14, 3, 5, 22, P.ink], [15, 4, 3, 18, P.hi], [15, 15, 3, 7, P.red],
    [11, 23, 11, 6, P.ink], [13, 23, 7, 4, P.red], [19, 6, 4, 2, P.ink],
    [19, 11, 3, 2, P.ink], [19, 16, 4, 2, P.ink],
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
  const scale = size / 32;
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
      viewBox="0 0 32 32"
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
