import type { AuntieMood } from '../types';

interface PixelAuntieProps {
  mood: AuntieMood;
  size?: number;
  className?: string;
  moodValue?: number;
}

const C = {
  outline: '#2a1a18',
  hair: '#4b3028',
  bun: '#6a4a3b',
  face: '#f4c08f',
  cheek: '#e98674',
  lens: '#fff7d7',
  apron: '#fff7d7',
  green: '#58a84c',
  teal: '#2ba59d',
  red: '#d8432b',
  shadow: '#b57a56',
  white: '#ffffff',
};

function R({ x, y, w = 1, h = 1, c }: { x: number; y: number; w?: number; h?: number; c: string }) {
  return <rect x={x} y={y} width={w} height={h} fill={c} />;
}

export function PixelAuntie({ mood, size = 96, className = '', moodValue = 0 }: PixelAuntieProps) {
  const happy =
    mood === 'cheering' ||
    mood === 'dish_perfect' ||
    mood === 'tasting' ||
    moodValue > 20;
  const worried = mood === 'worried' || mood === 'dish_burned' || moodValue < -20;
  const pointing = mood === 'tutorial_pointing';

  return (
    <svg
      viewBox="0 0 32 32"
      width={size}
      height={size}
      className={`pixel-art ${className}`}
      shapeRendering="crispEdges"
      aria-hidden
    >
      <R x={12} y={1} w={8} h={2} c={C.outline} />
      <R x={10} y={3} w={12} h={3} c={C.outline} />
      <R x={12} y={3} w={8} h={2} c={C.bun} />
      <R x={14} y={2} w={4} h={1} c={C.green} />

      <R x={8} y={6} w={16} h={3} c={C.outline} />
      <R x={7} y={9} w={18} h={8} c={C.outline} />
      <R x={9} y={7} w={14} h={9} c={C.hair} />
      <R x={9} y={10} w={14} h={8} c={C.face} />
      <R x={11} y={9} w={10} h={1} c={C.shadow} />
      <R x={8} y={12} w={1} h={4} c={C.hair} />
      <R x={23} y={12} w={1} h={4} c={C.hair} />

      <R x={10} y={12} w={5} h={4} c={C.outline} />
      <R x={17} y={12} w={5} h={4} c={C.outline} />
      <R x={11} y={13} w={3} h={2} c={C.lens} />
      <R x={18} y={13} w={3} h={2} c={C.lens} />
      <R x={12} y={13} c={C.outline} />
      <R x={19} y={13} c={C.outline} />
      <R x={15} y={14} w={2} h={1} c={C.outline} />
      <R x={9} y={16} w={3} h={1} c={C.cheek} />
      <R x={20} y={16} w={3} h={1} c={C.cheek} />

      {happy ? (
        <>
          <R x={14} y={17} w={4} h={1} c={C.outline} />
          <R x={15} y={18} w={2} h={1} c={C.red} />
        </>
      ) : worried ? (
        <>
          <R x={15} y={17} w={2} h={2} c={C.outline} />
          <R x={16} y={18} c={C.red} />
        </>
      ) : (
        <>
          <R x={14} y={17} w={4} h={2} c={C.outline} />
          <R x={15} y={18} w={2} h={1} c={C.red} />
        </>
      )}

      <R x={8} y={20} w={16} h={10} c={C.outline} />
      <R x={9} y={20} w={14} h={9} c={C.green} />
      <R x={12} y={19} w={8} h={2} c={C.outline} />
      <R x={13} y={19} w={2} h={2} c={C.teal} />
      <R x={17} y={19} w={2} h={2} c={C.teal} />
      <R x={12} y={21} w={8} h={8} c={C.apron} />
      <R x={14} y={22} w={4} h={1} c="#e0c99c" />
      <R x={15} y={24} w={3} h={1} c="#7c5c3a" />
      <R x={16} y={25} w={1} h={3} c="#7c5c3a" />

      <R x={5} y={22} w={4} h={5} c={C.outline} />
      <R x={6} y={23} w={3} h={3} c={C.face} />
      <R x={23} y={22} w={4} h={5} c={C.outline} />
      <R x={23} y={23} w={3} h={3} c={C.face} />
      {pointing && (
        <>
          <R x={24} y={20} w={5} h={3} c={C.outline} />
          <R x={24} y={21} w={4} h={1} c={C.face} />
        </>
      )}

      <R x={10} y={29} w={12} h={1} c={C.red} />
      <R x={8} y={30} w={16} h={1} c={C.outline} />
    </svg>
  );
}
