// Reusable rich-SVG primitives for ingredients and dishes. Each component
// returns an SVG <g> with multiple gradients, patterns, and layered shapes —
// built to look hand-illustrated rather than crude shapes.
//
// Usage: <svg viewBox="..."><Defs/><HainaneseChickenRiceMini x={50} y={50} /></svg>
//
// All defs live inside a single shared <Defs/> component that you place once
// per outer <svg>. Component IDs are namespaced ("hm-...") to avoid clashes.

export function Defs() {
  return (
    <defs>
      {/* ----- Plates / ceramics ----- */}
      <radialGradient id="hm-plate" cx="0.5" cy="0.4" r="0.7">
        <stop offset="0%" stopColor="#FFFFFF" />
        <stop offset="70%" stopColor="#F4ECDC" />
        <stop offset="100%" stopColor="#D9CDB6" />
      </radialGradient>
      <radialGradient id="hm-bowl-inside" cx="0.5" cy="0.45" r="0.6">
        <stop offset="0%" stopColor="#E36F5C" />
        <stop offset="70%" stopColor="#D8432B" />
        <stop offset="100%" stopColor="#A93521" />
      </radialGradient>
      <linearGradient id="hm-bowl-outer" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#FFFFFF" />
        <stop offset="100%" stopColor="#D9CDB6" />
      </linearGradient>

      {/* ----- Rice ----- */}
      <radialGradient id="hm-rice" cx="0.5" cy="0.4" r="0.6">
        <stop offset="0%" stopColor="#FFFCEC" />
        <stop offset="70%" stopColor="#F4E9C7" />
        <stop offset="100%" stopColor="#D8C99B" />
      </radialGradient>
      <pattern id="hm-rice-grain" x="0" y="0" width="6" height="6" patternUnits="userSpaceOnUse">
        <ellipse cx="3" cy="3" rx="1.5" ry="0.6" fill="#C9B97F" opacity="0.55" />
      </pattern>

      {/* ----- Chicken ----- */}
      <linearGradient id="hm-chicken-flesh" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#FBE3BF" />
        <stop offset="55%" stopColor="#F1C9A4" />
        <stop offset="100%" stopColor="#D8AB7C" />
      </linearGradient>
      <linearGradient id="hm-chicken-skin" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#FFE9B0" />
        <stop offset="100%" stopColor="#E5C273" />
      </linearGradient>

      {/* ----- Soup / laksa ----- */}
      <radialGradient id="hm-laksa-soup" cx="0.5" cy="0.5" r="0.6">
        <stop offset="0%" stopColor="#F2A37A" />
        <stop offset="60%" stopColor="#D8674B" />
        <stop offset="100%" stopColor="#A23F25" />
      </radialGradient>

      {/* ----- Prata dough ----- */}
      <linearGradient id="hm-dough" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#FFF1D6" />
        <stop offset="60%" stopColor="#F1C9A4" />
        <stop offset="100%" stopColor="#A87A50" />
      </linearGradient>

      {/* ----- Crab carapace ----- */}
      <radialGradient id="hm-crab" cx="0.5" cy="0.4" r="0.7">
        <stop offset="0%" stopColor="#FF6B47" />
        <stop offset="70%" stopColor="#D8432B" />
        <stop offset="100%" stopColor="#7E2113" />
      </radialGradient>

      {/* ----- Bread / toast ----- */}
      <linearGradient id="hm-bread" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#F1D6A1" />
        <stop offset="60%" stopColor="#D8A86F" />
        <stop offset="100%" stopColor="#9A6C3D" />
      </linearGradient>
      <linearGradient id="hm-kaya" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#A8772D" />
        <stop offset="100%" stopColor="#7C5418" />
      </linearGradient>

      {/* ----- Greens ----- */}
      <linearGradient id="hm-cucumber-skin" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#92C97A" />
        <stop offset="100%" stopColor="#558D40" />
      </linearGradient>
      <radialGradient id="hm-cucumber-flesh" cx="0.5" cy="0.5" r="0.6">
        <stop offset="0%" stopColor="#EFF8DD" />
        <stop offset="100%" stopColor="#C9DFA1" />
      </radialGradient>
      <linearGradient id="hm-leaf" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#92C97A" />
        <stop offset="100%" stopColor="#3A6A22" />
      </linearGradient>

      {/* ----- Wood / counter ----- */}
      <linearGradient id="hm-wood" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#C9925A" />
        <stop offset="100%" stopColor="#8E5A2F" />
      </linearGradient>
      <pattern id="hm-wood-grain" x="0" y="0" width="40" height="6" patternUnits="userSpaceOnUse">
        <path d="M 0 3 Q 10 1 20 3 T 40 3" stroke="rgba(58,45,36,0.18)" strokeWidth="0.6" fill="none" />
      </pattern>

      {/* ----- Awning fabric ----- */}
      <pattern id="hm-awning" x="0" y="0" width="14" height="22" patternUnits="userSpaceOnUse">
        <rect width="7" height="22" fill="#D8432B" />
        <rect x="7" width="7" height="22" fill="#FFF7E8" />
      </pattern>

      {/* ----- Steam wisp ----- */}
      <linearGradient id="hm-steam" x1="0" y1="1" x2="0" y2="0">
        <stop offset="0%" stopColor="rgba(255,255,255,0.0)" />
        <stop offset="100%" stopColor="rgba(255,255,255,0.85)" />
      </linearGradient>

      {/* ----- Sambal red ----- */}
      <linearGradient id="hm-sambal" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#E55A3F" />
        <stop offset="100%" stopColor="#8E2A1A" />
      </linearGradient>

      {/* ----- Filters ----- */}
      <filter id="hm-soft-shadow" x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur in="SourceAlpha" stdDeviation="1.5" />
        <feOffset dx="0" dy="2" />
        <feComponentTransfer><feFuncA type="linear" slope="0.45" /></feComponentTransfer>
        <feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge>
      </filter>
    </defs>
  );
}

// ----- Reusable mini illustrations (g elements with viewBox 0 0 100 100 by convention).

interface IconProps {
  x?: number;
  y?: number;
  scale?: number;
}

function group({ x = 0, y = 0, scale = 1 }: IconProps): string {
  return `translate(${x}, ${y}) scale(${scale})`;
}

// Hainanese chicken rice on a small plate, 100x100 viewBox.
export function ChickenRiceIcon(p: IconProps = {}) {
  return (
    <g transform={group(p)}>
      {/* table shadow */}
      <ellipse cx="50" cy="78" rx="42" ry="6" fill="rgba(58,45,36,0.18)" />
      {/* plate rim */}
      <ellipse cx="50" cy="62" rx="44" ry="14" fill="#3A2D24" />
      <ellipse cx="50" cy="60" rx="42" ry="13" fill="url(#hm-plate)" />
      {/* well */}
      <ellipse cx="50" cy="61" rx="34" ry="9" fill="rgba(58,45,36,0.10)" />
      <ellipse cx="50" cy="60" rx="34" ry="9" fill="url(#hm-plate)" />
      {/* rice */}
      <ellipse cx="50" cy="58" rx="28" ry="7" fill="url(#hm-rice)" stroke="rgba(58,45,36,0.18)" strokeWidth="0.6" />
      <ellipse cx="50" cy="58" rx="28" ry="7" fill="url(#hm-rice-grain)" opacity="0.85" />
      {/* chicken slices fan */}
      <g transform="translate(50, 56)">
        <g transform="translate(-12, 1) rotate(-7)">
          <ellipse cx="0" cy="0" rx="11" ry="3.5" fill="url(#hm-chicken-flesh)" stroke="#7B5A3D" strokeWidth="0.6" />
          <path d="M -9 -2.5 Q 0 -4 9 -2.5 L 9 -1 Q 0 -2.5 -9 -1 Z" fill="url(#hm-chicken-skin)" stroke="#7B5A3D" strokeWidth="0.4" />
        </g>
        <g transform="translate(0, -1)">
          <ellipse cx="0" cy="0" rx="13" ry="4" fill="url(#hm-chicken-flesh)" stroke="#7B5A3D" strokeWidth="0.7" />
          <path d="M -10 -3 Q 0 -4.5 10 -3 L 10 -1 Q 0 -2.8 -10 -1 Z" fill="url(#hm-chicken-skin)" stroke="#7B5A3D" strokeWidth="0.4" />
        </g>
        <g transform="translate(12, 1) rotate(8)">
          <ellipse cx="0" cy="0" rx="11" ry="3.5" fill="url(#hm-chicken-flesh)" stroke="#7B5A3D" strokeWidth="0.6" />
          <path d="M -9 -2.5 Q 0 -4 9 -2.5 L 9 -1 Q 0 -2.5 -9 -1 Z" fill="url(#hm-chicken-skin)" stroke="#7B5A3D" strokeWidth="0.4" />
        </g>
      </g>
      {/* sauce drizzle */}
      <path d="M 35 56 Q 42 60 50 57 T 65 58" stroke="#A82616" strokeWidth="1.4" fill="none" strokeLinecap="round" opacity="0.85" />
      <path d="M 38 60 Q 46 56 54 60 T 62 60" stroke="#A82616" strokeWidth="1" fill="none" strokeLinecap="round" opacity="0.7" />
      {/* coriander leaf accent */}
      <path d="M 28 54 Q 24 51 21 54 Q 23 58 27 56 Z" fill="url(#hm-leaf)" stroke="#3A6A22" strokeWidth="0.5" />
      {/* cucumber slice */}
      <g transform="translate(72, 56)">
        <circle cx="0" cy="0" r="4.5" fill="url(#hm-cucumber-skin)" stroke="#3A4F23" strokeWidth="0.5" />
        <circle cx="0" cy="0" r="3.4" fill="url(#hm-cucumber-flesh)" stroke="#86A86A" strokeWidth="0.3" />
        {[0,1,2].map(i => {
          const a = (i / 3) * Math.PI * 2;
          return <ellipse key={i} cx={Math.cos(a)*1.6} cy={Math.sin(a)*1.6} rx="0.3" ry="0.6" fill="#9DBC78" />
        })}
      </g>
      {/* steam */}
      <path d="M 40 38 q -2 -8 0 -14 q 2 -4 0 -10" stroke="rgba(58,45,36,0.35)" strokeWidth="1" fill="none" />
      <path d="M 60 38 q 2 -8 0 -14 q -2 -4 0 -10" stroke="rgba(58,45,36,0.35)" strokeWidth="1" fill="none" />
    </g>
  );
}

// Bowl of laksa, 100x100 viewBox.
export function LaksaIcon(p: IconProps = {}) {
  return (
    <g transform={group(p)}>
      <ellipse cx="50" cy="80" rx="42" ry="6" fill="rgba(58,45,36,0.18)" />
      {/* bowl outer */}
      <ellipse cx="50" cy="64" rx="40" ry="14" fill="#3A2D24" />
      <ellipse cx="50" cy="62" rx="38" ry="13" fill="url(#hm-bowl-outer)" />
      {/* bowl inner soup */}
      <ellipse cx="50" cy="62" rx="32" ry="10" fill="url(#hm-laksa-soup)" />
      {/* coconut milk swirl on top */}
      <path d="M 28 60 Q 50 56 72 60" stroke="rgba(255,237,210,0.55)" strokeWidth="2" fill="none" strokeLinecap="round" />
      {/* noodles */}
      <path d="M 30 62 q 8 4 16 0 q 8 -4 14 2" stroke="#FFEEC8" strokeWidth="1.4" fill="none" />
      <path d="M 32 64 q 10 -2 18 2 q 8 4 16 0" stroke="#FFEEC8" strokeWidth="1.4" fill="none" />
      {/* prawn */}
      <g transform="translate(38, 56)">
        <path d="M 0 0 q 4 -4 8 -2 q 4 2 6 6 q -4 0 -8 -2 q -4 -2 -6 -2 Z" fill="#FFA38A" stroke="#7E2113" strokeWidth="0.6" />
        <path d="M 1 1 q 3 -2 6 -1" stroke="#7E2113" strokeWidth="0.4" fill="none" />
      </g>
      {/* fishcake slice */}
      <g transform="translate(60, 60)">
        <circle cx="0" cy="0" r="4" fill="#FFF8E6" stroke="#A93521" strokeWidth="0.6" />
        <path d="M -3 0 q 0 -3 3 -3 q 3 0 3 3" stroke="#D8432B" strokeWidth="0.6" fill="none" />
      </g>
      {/* laksa leaf accent */}
      <path d="M 22 56 Q 18 53 15 56 Q 17 60 21 58 Z" fill="url(#hm-leaf)" stroke="#3A6A22" strokeWidth="0.4" />
      {/* steam */}
      <path d="M 42 36 q -2 -8 0 -14 q 2 -4 0 -10" stroke="rgba(58,45,36,0.35)" strokeWidth="1" fill="none" />
      <path d="M 58 36 q 2 -8 0 -14 q -2 -4 0 -10" stroke="rgba(58,45,36,0.35)" strokeWidth="1" fill="none" />
    </g>
  );
}

// Folded prata with curry, 100x100 viewBox.
export function PrataIcon(p: IconProps = {}) {
  return (
    <g transform={group(p)}>
      <ellipse cx="50" cy="80" rx="42" ry="6" fill="rgba(58,45,36,0.18)" />
      {/* plate */}
      <ellipse cx="50" cy="64" rx="42" ry="13" fill="#3A2D24" />
      <ellipse cx="50" cy="62" rx="40" ry="12" fill="url(#hm-plate)" />
      {/* prata folded triangle */}
      <g transform="translate(50, 56)">
        <path d="M -22 6 L 4 -16 L 22 4 Z" fill="url(#hm-dough)" stroke="#7E5022" strokeWidth="0.7" />
        <path d="M -20 4 L 2 -14" stroke="#A87A50" strokeWidth="0.5" fill="none" />
        <path d="M -16 6 L 14 4" stroke="#A87A50" strokeWidth="0.5" fill="none" />
        <path d="M -12 0 Q 2 -8 18 0" stroke="rgba(126,80,34,0.5)" strokeWidth="0.4" fill="none" />
        {/* crispy edge highlight */}
        <path d="M -22 6 L 22 4" stroke="#FFE6BB" strokeWidth="0.6" fill="none" opacity="0.7" />
      </g>
      {/* curry dipping bowl */}
      <g transform="translate(76, 62)">
        <ellipse cx="0" cy="2" rx="14" ry="4" fill="#3A2D24" />
        <ellipse cx="0" cy="0" rx="12" ry="3.5" fill="url(#hm-bowl-outer)" />
        <ellipse cx="0" cy="-1" rx="10" ry="2.5" fill="#9F4520" />
        <circle cx="-3" cy="-1" r="0.6" fill="#FFB870" opacity="0.7" />
        <circle cx="2" cy="-1" r="0.4" fill="#FFB870" opacity="0.7" />
      </g>
    </g>
  );
}

// Whole crab with sauce, 100x100 viewBox.
export function CrabIcon(p: IconProps = {}) {
  return (
    <g transform={group(p)}>
      <ellipse cx="50" cy="80" rx="42" ry="6" fill="rgba(58,45,36,0.18)" />
      {/* plate */}
      <ellipse cx="50" cy="66" rx="44" ry="13" fill="#3A2D24" />
      <ellipse cx="50" cy="64" rx="42" ry="12" fill="url(#hm-plate)" />
      {/* sauce pool */}
      <ellipse cx="50" cy="64" rx="34" ry="8" fill="url(#hm-sambal)" opacity="0.9" />
      <path d="M 22 64 q 28 -4 56 0" stroke="rgba(255,200,170,0.5)" strokeWidth="1" fill="none" />
      {/* crab body */}
      <ellipse cx="50" cy="56" rx="20" ry="13" fill="url(#hm-crab)" stroke="#7E2113" strokeWidth="0.8" />
      <ellipse cx="50" cy="53" rx="14" ry="8" fill="#FF8163" opacity="0.6" />
      {/* eyes */}
      <circle cx="44" cy="48" r="1.6" fill="#3A2D24" />
      <circle cx="56" cy="48" r="1.6" fill="#3A2D24" />
      <circle cx="44.5" cy="47.5" r="0.5" fill="#fff" />
      <circle cx="56.5" cy="47.5" r="0.5" fill="#fff" />
      {/* claws */}
      <g transform="translate(28, 56) rotate(-30)">
        <ellipse cx="0" cy="0" rx="6" ry="3" fill="url(#hm-crab)" stroke="#7E2113" strokeWidth="0.5" />
        <path d="M -5 -1 L -10 -4 M -5 1 L -10 4" stroke="#7E2113" strokeWidth="0.6" />
      </g>
      <g transform="translate(72, 56) rotate(30)">
        <ellipse cx="0" cy="0" rx="6" ry="3" fill="url(#hm-crab)" stroke="#7E2113" strokeWidth="0.5" />
        <path d="M 5 -1 L 10 -4 M 5 1 L 10 4" stroke="#7E2113" strokeWidth="0.6" />
      </g>
      {/* legs */}
      {[0, 1, 2].map((i) => (
        <g key={`l${i}`}>
          <path d={`M ${36 - i * 2} ${60 + i} q -5 ${1 + i} -8 ${3 + i * 2}`} stroke="#7E2113" strokeWidth="1.4" fill="none" strokeLinecap="round" />
          <path d={`M ${64 + i * 2} ${60 + i} q 5 ${1 + i} 8 ${3 + i * 2}`} stroke="#7E2113" strokeWidth="1.4" fill="none" strokeLinecap="round" />
        </g>
      ))}
    </g>
  );
}

// Stacked kaya toast + kopi cup, 100x100 viewBox.
export function KayaToastIcon(p: IconProps = {}) {
  return (
    <g transform={group(p)}>
      <ellipse cx="50" cy="82" rx="42" ry="6" fill="rgba(58,45,36,0.18)" />
      {/* plate */}
      <ellipse cx="34" cy="68" rx="28" ry="6" fill="#3A2D24" />
      <ellipse cx="34" cy="66" rx="26" ry="5" fill="url(#hm-plate)" />
      {/* toast stack */}
      <g transform="translate(34, 60)">
        {/* bottom slice */}
        <rect x="-18" y="0" width="36" height="8" rx="2" fill="url(#hm-bread)" stroke="#7E5022" strokeWidth="0.6" />
        {/* kaya layer */}
        <rect x="-18" y="-2" width="36" height="3" fill="url(#hm-kaya)" stroke="#5A3A14" strokeWidth="0.4" />
        {/* butter slab peeking */}
        <rect x="-14" y="-3" width="6" height="2" fill="#FFE9B0" />
        {/* top slice */}
        <rect x="-18" y="-10" width="36" height="8" rx="2" fill="url(#hm-bread)" stroke="#7E5022" strokeWidth="0.6" />
        {/* grill marks */}
        <line x1="-14" y1="3" x2="14" y2="3" stroke="rgba(58,45,36,0.4)" strokeWidth="0.6" />
        <line x1="-14" y1="-7" x2="14" y2="-7" stroke="rgba(58,45,36,0.4)" strokeWidth="0.6" />
        {/* crumb texture */}
        {[-12, -6, 0, 6, 12].map((dx) => (
          <circle key={dx} cx={dx} cy={3} r="0.5" fill="rgba(58,45,36,0.3)" />
        ))}
      </g>
      {/* kopi cup */}
      <g transform="translate(72, 60)">
        <ellipse cx="0" cy="14" rx="14" ry="4" fill="#3A2D24" />
        <path d="M -12 -2 Q -12 14 0 16 Q 12 14 12 -2 Z" fill="url(#hm-bowl-outer)" stroke="#3A2D24" strokeWidth="0.7" />
        <ellipse cx="0" cy="-2" rx="11" ry="3" fill="#3D2310" />
        <ellipse cx="-2" cy="-3" rx="8" ry="1.5" fill="#fff" opacity="0.6" />
        {/* handle */}
        <path d="M 12 0 Q 18 0 18 6 Q 18 10 12 10" stroke="#3A2D24" strokeWidth="1.2" fill="none" />
        {/* steam */}
        <path d="M -4 -8 q -2 -6 0 -10" stroke="rgba(58,45,36,0.4)" strokeWidth="0.8" fill="none" />
        <path d="M 4 -8 q 2 -6 0 -10" stroke="rgba(58,45,36,0.4)" strokeWidth="0.8" fill="none" />
      </g>
    </g>
  );
}

// ----- Hawker stall card (used on the map). 130x110 viewBox. -----
interface StallProps extends IconProps {
  swatchColor: string; // not used in body, kept for API parity with old design
  unlocked: boolean;
  stars: number;
  dishLabel: string;
  dishIcon: 'chicken-rice' | 'laksa' | 'prata' | 'chili-crab' | 'kaya-toast';
  onClick?: () => void;
  ariaLabel: string;
}

export function StallCard({ x = 0, y = 0, scale = 1, unlocked, stars, dishLabel, dishIcon, onClick, ariaLabel }: StallProps) {
  const Icon = ({
    'chicken-rice': ChickenRiceIcon,
    'laksa': LaksaIcon,
    'prata': PrataIcon,
    'chili-crab': CrabIcon,
    'kaya-toast': KayaToastIcon,
  } as const)[dishIcon];

  return (
    <g
      transform={`translate(${x}, ${y}) scale(${scale})`}
      style={{ cursor: unlocked ? 'pointer' : 'not-allowed' }}
      onClick={onClick}
      role="button"
      aria-label={ariaLabel}
      tabIndex={unlocked ? 0 : -1}
    >
      {/* Solid invisible hit rect so the whole stall card receives clicks */}
      <rect x="-4" y="-12" width="138" height="120" fill="transparent" />
      {/* shadow */}
      <ellipse cx="65" cy="105" rx="62" ry="6" fill="rgba(58,45,36,0.18)" />
      {/* awning back fold */}
      <path d="M 4 4 L 126 4 L 132 18 L -2 18 Z" fill="#7E2113" />
      {/* awning fabric */}
      <path d="M 0 0 L 130 0 L 130 18 L 0 18 Z" fill="url(#hm-awning)" />
      {/* awning trim */}
      <path d="M 0 18 q 6 6 12 0 q 6 -6 12 0 q 6 6 12 0 q 6 -6 12 0 q 6 6 12 0 q 6 -6 12 0 q 6 6 12 0 q 6 -6 12 0 q 6 6 12 0 q 6 -6 12 0 q 6 6 10 0 L 130 18 Z" fill="#7E2113" />
      {/* posts */}
      <rect x="2" y="18" width="4" height="78" fill="#5A3F26" />
      <rect x="124" y="18" width="4" height="78" fill="#5A3F26" />
      {/* counter */}
      <rect x="0" y="78" width="130" height="22" rx="3" fill="url(#hm-wood)" stroke="#3A2D24" strokeWidth="1.5" />
      <rect x="0" y="78" width="130" height="22" rx="3" fill="url(#hm-wood-grain)" />
      {/* sign */}
      <rect x="22" y="68" width="86" height="14" rx="3" fill="#FFF7E8" stroke="#3A2D24" strokeWidth="1.3" />
      <text x="65" y="78" textAnchor="middle" fontSize="10" fontWeight="700" fontFamily="M PLUS Rounded 1c, sans-serif" fill="#3A2D24">{dishLabel}</text>
      {/* dish on counter */}
      <g transform="translate(15, 22)">
        {/* lit area gradient hint */}
        <ellipse cx="50" cy="60" rx="50" ry="22" fill="rgba(232,184,58,0.10)" />
        <Icon scale={1} />
      </g>
      {/* stars (top) */}
      {[1, 2, 3].map((i) => (
        <g key={i} transform={`translate(${42 + i * 16}, -8)`}>
          <circle r="6" fill={i <= stars ? '#E8B83A' : 'transparent'} stroke="#3A2D24" strokeWidth="1.5" />
          {i <= stars && <text textAnchor="middle" y="3" fontSize="9" fill="#7E5C0F">★</text>}
        </g>
      ))}
      {/* lock overlay */}
      {!unlocked && (
        <g>
          <rect x="0" y="0" width="130" height="100" rx="3" fill="rgba(0,0,0,0.42)" />
          <circle cx="65" cy="48" r="14" fill="#3A2D24" />
          <text x="65" y="53" fontSize="16" textAnchor="middle" fill="#FFF7E8">🔒</text>
        </g>
      )}
    </g>
  );
}
