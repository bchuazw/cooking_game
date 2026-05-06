import type { ReactNode } from 'react';

// Shared illustrated food and station assets.
// The goal is to keep interactive game objects crisp and deterministic while
// giving the screens a richer picture-book hawker-centre finish.

export type FoodKind =
  | 'shallot'
  | 'garlic'
  | 'ginger'
  | 'pandan'
  | 'stock'
  | 'coconut'
  | 'taupok'
  | 'noodle'
  | 'prawn'
  | 'fishcake'
  | 'sprouts'
  | 'sambal'
  | 'laksaLeaf'
  | 'doughBall'
  | 'doughSheet'
  | 'prata'
  | 'crab'
  | 'mantou'
  | 'toast'
  | 'kayaToast'
  | 'egg'
  | 'crackedEgg'
  | 'kopiCup'
  | 'cucumber'
  | 'coriander'
  | 'chickenSlice';

export type StationVariant = 'prep' | 'wok' | 'grill' | 'seafood' | 'kopi';

interface FoodIconProps {
  kind: FoodKind;
  x?: number;
  y?: number;
  size?: number;
  opacity?: number;
}

interface FoodIconSvgProps {
  kind: FoodKind;
  size?: number;
  className?: string;
  title?: string;
}

export function FoodDefs() {
  return (
    <defs>
      <linearGradient id="fi-counter" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#D7A66F" />
        <stop offset="55%" stopColor="#B9773F" />
        <stop offset="100%" stopColor="#7E5022" />
      </linearGradient>
      <pattern id="fi-woodgrain" x="0" y="0" width="42" height="10" patternUnits="userSpaceOnUse">
        <path d="M0 5 Q10 1 21 5 T42 5" stroke="rgba(58,45,36,0.22)" strokeWidth="0.9" fill="none" />
        <path d="M8 8 Q20 4 34 8" stroke="rgba(255,255,255,0.15)" strokeWidth="0.6" fill="none" />
      </pattern>
      <pattern id="fi-tile" x="0" y="0" width="36" height="36" patternUnits="userSpaceOnUse">
        <rect width="36" height="36" fill="#FFF7E8" />
        <path d="M0 0 H36 V36 H0 Z" fill="none" stroke="#E2D5BE" strokeWidth="0.8" />
        <path d="M18 4 L32 18 L18 32 L4 18 Z" fill="#2BA59D" opacity="0.13" />
        <circle cx="18" cy="18" r="4" fill="#D8432B" opacity="0.1" />
      </pattern>
      <radialGradient id="fi-shadow" cx="0.5" cy="0.5" r="0.5">
        <stop offset="0%" stopColor="rgba(58,45,36,0.28)" />
        <stop offset="100%" stopColor="rgba(58,45,36,0)" />
      </radialGradient>
      <radialGradient id="fi-plate" cx="0.5" cy="0.38" r="0.65">
        <stop offset="0%" stopColor="#FFFFFF" />
        <stop offset="72%" stopColor="#F4EFE6" />
        <stop offset="100%" stopColor="#D6C7AD" />
      </radialGradient>
      <radialGradient id="fi-wok" cx="0.5" cy="0.42" r="0.68">
        <stop offset="0%" stopColor="#64544A" />
        <stop offset="58%" stopColor="#33251E" />
        <stop offset="100%" stopColor="#17110E" />
      </radialGradient>
      <linearGradient id="fi-bread" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#FFE5B8" />
        <stop offset="54%" stopColor="#D99A52" />
        <stop offset="100%" stopColor="#8F572C" />
      </linearGradient>
      <linearGradient id="fi-kaya" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#B9852E" />
        <stop offset="100%" stopColor="#68410F" />
      </linearGradient>
      <linearGradient id="fi-dough" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#FFF2D7" />
        <stop offset="58%" stopColor="#F1C9A4" />
        <stop offset="100%" stopColor="#A87545" />
      </linearGradient>
      <radialGradient id="fi-crab" cx="0.45" cy="0.34" r="0.75">
        <stop offset="0%" stopColor="#FF7857" />
        <stop offset="58%" stopColor="#D8432B" />
        <stop offset="100%" stopColor="#7B2114" />
      </radialGradient>
      <radialGradient id="fi-laksa" cx="0.5" cy="0.5" r="0.65">
        <stop offset="0%" stopColor="#F4AE78" />
        <stop offset="64%" stopColor="#D8674B" />
        <stop offset="100%" stopColor="#8E2A1A" />
      </radialGradient>
      <linearGradient id="fi-leaf" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#A8D88C" />
        <stop offset="100%" stopColor="#3F742B" />
      </linearGradient>
      <linearGradient id="fi-chicken" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#FFE4BC" />
        <stop offset="58%" stopColor="#F0C197" />
        <stop offset="100%" stopColor="#C88B5C" />
      </linearGradient>
      <filter id="fi-soft" x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur in="SourceAlpha" stdDeviation="1.5" />
        <feOffset dy="2" />
        <feComponentTransfer><feFuncA type="linear" slope="0.35" /></feComponentTransfer>
        <feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge>
      </filter>
    </defs>
  );
}

function wrap({ x = 0, y = 0, size = 100, opacity = 1 }: Omit<FoodIconProps, 'kind'>, children: ReactNode) {
  return (
    <g transform={`translate(${x}, ${y}) scale(${size / 100})`} opacity={opacity} filter="url(#fi-soft)">
      <ellipse cx="50" cy="86" rx="34" ry="8" fill="url(#fi-shadow)" />
      {children}
    </g>
  );
}

export function FoodIconSvg({ kind, size = 64, className = '', title }: FoodIconSvgProps) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} className={className} role={title ? 'img' : 'presentation'} aria-label={title}>
      <FoodDefs />
      <FoodIcon kind={kind} />
    </svg>
  );
}

export function FoodIcon(props: FoodIconProps) {
  switch (props.kind) {
    case 'shallot':
      return wrap(props, (
        <>
          <path d="M50 18 C28 34 30 64 50 78 C70 64 72 34 50 18 Z" fill="#B96C98" stroke="#3A2D24" strokeWidth="3" />
          <path d="M50 20 C44 38 44 58 50 76 M38 36 C44 44 44 60 38 68 M62 36 C56 44 56 60 62 68" stroke="#F2B5CE" strokeWidth="2" fill="none" opacity="0.75" />
          <path d="M44 18 Q50 8 56 18" stroke="#558D40" strokeWidth="4" fill="none" strokeLinecap="round" />
        </>
      ));
    case 'garlic':
      return wrap(props, (
        <>
          <path d="M22 61 C22 37 40 22 50 31 C60 22 78 37 78 61 C78 77 62 82 50 72 C38 82 22 77 22 61 Z" fill="#FFF4D7" stroke="#3A2D24" strokeWidth="3" />
          <path d="M50 31 C43 42 43 60 50 72 M35 43 C40 52 40 64 36 72 M65 43 C60 52 60 64 64 72" stroke="#C9B78D" strokeWidth="2" fill="none" />
          <path d="M45 31 Q50 18 55 31" stroke="#6FB552" strokeWidth="3" fill="none" strokeLinecap="round" />
        </>
      ));
    case 'ginger':
      return wrap(props, (
        <>
          <path d="M23 60 C28 42 42 43 45 30 C56 27 62 35 60 45 C75 45 80 55 73 67 C65 78 45 75 35 72 C26 72 20 68 23 60 Z" fill="#DDA664" stroke="#3A2D24" strokeWidth="3" />
          <path d="M35 58 Q48 53 62 60 M43 44 Q52 48 57 43 M36 68 Q47 63 60 68" stroke="#8E5A2F" strokeWidth="1.6" fill="none" opacity="0.65" />
          <ellipse cx="48" cy="55" rx="6" ry="3" fill="#FFE0A7" opacity="0.5" />
        </>
      ));
    case 'pandan':
    case 'laksaLeaf':
    case 'coriander':
      return wrap(props, (
        <>
          <g transform={props.kind === 'coriander' ? 'translate(0, 2)' : ''}>
            {[0, 1, 2, 3, 4].map((i) => {
              const rot = -42 + i * 21;
              return (
                <path
                  key={i}
                  d="M50 78 C42 50 44 29 50 18 C56 29 58 50 50 78 Z"
                  transform={`rotate(${rot} 50 78)`}
                  fill="url(#fi-leaf)"
                  stroke="#315F22"
                  strokeWidth="2"
                />
              );
            })}
            <path d="M50 80 C48 55 49 35 50 18" stroke="#D8F2C5" strokeWidth="1.5" fill="none" opacity="0.65" />
          </g>
        </>
      ));
    case 'stock':
      return wrap(props, (
        <>
          <path d="M24 48 C24 33 76 33 76 48 L69 76 C66 84 34 84 31 76 Z" fill="#FFFFFF" stroke="#3A2D24" strokeWidth="3" />
          <ellipse cx="50" cy="48" rx="27" ry="10" fill="#E8B83A" stroke="#3A2D24" strokeWidth="2" />
          <path d="M34 46 Q50 52 66 46" stroke="#FFF4C8" strokeWidth="3" fill="none" opacity="0.7" />
          <path d="M36 33 q-4 -9 2 -16 M52 31 q4 -9 -1 -18 M66 34 q5 -9 -1 -17" stroke="#3A2D24" strokeWidth="2" fill="none" opacity="0.35" />
        </>
      ));
    case 'coconut':
      return wrap(props, (
        <>
          <circle cx="50" cy="52" r="30" fill="#6B4028" stroke="#3A2D24" strokeWidth="3" />
          <path d="M28 54 C38 34 61 31 74 48 C61 43 42 45 28 54 Z" fill="#9B6B43" opacity="0.55" />
          <circle cx="42" cy="44" r="3" fill="#3A2D24" />
          <circle cx="55" cy="42" r="3" fill="#3A2D24" />
          <circle cx="51" cy="55" r="3" fill="#3A2D24" />
          <path d="M31 63 Q50 72 69 61" stroke="#F7E8D0" strokeWidth="3" fill="none" opacity="0.45" />
        </>
      ));
    case 'taupok':
      return wrap(props, (
        <>
          <path d="M26 38 L70 31 L78 64 L35 74 Z" fill="#C7893A" stroke="#3A2D24" strokeWidth="3" />
          <path d="M31 42 L69 36 L73 60 L38 68 Z" fill="#E4B15E" opacity="0.75" />
          <circle cx="45" cy="50" r="3" fill="#8E5A2F" opacity="0.55" />
          <circle cx="60" cy="56" r="2.5" fill="#8E5A2F" opacity="0.45" />
          <path d="M35 63 Q53 56 73 60" stroke="#FFF0B8" strokeWidth="2" fill="none" opacity="0.45" />
        </>
      ));
    case 'noodle':
      return wrap(props, (
        <>
          <path d="M26 62 q9 -10 18 0 t18 0 t18 0" stroke="#FFEBC5" strokeWidth="8" fill="none" strokeLinecap="round" />
          <path d="M22 50 q8 -10 18 0 t18 0 t18 0" stroke="#F7D894" strokeWidth="5" fill="none" strokeLinecap="round" />
          <path d="M28 72 q9 -7 18 0 t18 0" stroke="#FFF7D8" strokeWidth="4" fill="none" strokeLinecap="round" />
        </>
      ));
    case 'prawn':
      return wrap(props, (
        <>
          <path d="M24 54 C34 30 67 31 76 55 C66 52 56 57 49 68 C39 65 30 60 24 54 Z" fill="#FF9B7C" stroke="#3A2D24" strokeWidth="3" />
          <path d="M35 43 Q48 50 61 42 M31 53 Q44 59 54 55" stroke="#A93521" strokeWidth="2" fill="none" />
          <path d="M74 55 q14 3 17 -8 M72 52 q12 -4 16 -15" stroke="#3A2D24" strokeWidth="2" fill="none" strokeLinecap="round" />
          <circle cx="39" cy="46" r="2.5" fill="#3A2D24" />
        </>
      ));
    case 'fishcake':
      return wrap(props, (
        <>
          <ellipse cx="50" cy="56" rx="31" ry="18" fill="#FFF7E8" stroke="#3A2D24" strokeWidth="3" />
          <path d="M24 56 C32 38 68 38 76 56" stroke="#D8432B" strokeWidth="5" fill="none" strokeLinecap="round" />
          <path d="M34 62 Q50 67 66 62" stroke="#D7C4AA" strokeWidth="2" fill="none" />
        </>
      ));
    case 'sprouts':
      return wrap(props, (
        <>
          {[28, 38, 50, 62, 72].map((x, i) => (
            <g key={x} transform={`rotate(${-18 + i * 9} ${x} 62)`}>
              <path d={`M${x} 74 C${x - 7} 56 ${x + 5} 44 ${x} 28`} stroke="#FFF3D5" strokeWidth="4" fill="none" strokeLinecap="round" />
              <ellipse cx={x + 2} cy="27" rx="7" ry="4" fill="#F8DCA5" stroke="#3A2D24" strokeWidth="1.2" />
            </g>
          ))}
        </>
      ));
    case 'sambal':
      return wrap(props, (
        <>
          <path d="M22 63 C24 42 43 30 60 36 C79 43 82 65 65 76 C47 88 20 82 22 63 Z" fill="#D8432B" stroke="#3A2D24" strokeWidth="3" />
          <path d="M34 55 C45 47 59 48 68 57" stroke="#FFB09D" strokeWidth="3" fill="none" opacity="0.65" />
          <circle cx="43" cy="66" r="3" fill="#7E2113" />
          <circle cx="57" cy="60" r="2.5" fill="#7E2113" opacity="0.75" />
        </>
      ));
    case 'doughBall':
      return wrap(props, (
        <>
          <ellipse cx="50" cy="58" rx="34" ry="25" fill="url(#fi-dough)" stroke="#3A2D24" strokeWidth="3" />
          <path d="M27 56 C38 43 62 42 73 55" stroke="#FFF4D8" strokeWidth="4" fill="none" opacity="0.65" />
          <path d="M32 67 Q50 74 68 66" stroke="#B98250" strokeWidth="2" fill="none" opacity="0.6" />
        </>
      ));
    case 'doughSheet':
      return wrap(props, (
        <>
          <path d="M15 52 C23 24 76 22 86 51 C80 78 25 82 15 52 Z" fill="rgba(255,244,216,0.74)" stroke="#3A2D24" strokeWidth="3" />
          <path d="M22 53 C36 42 63 42 78 52" stroke="#F1C9A4" strokeWidth="2" fill="none" opacity="0.6" />
          <path d="M28 64 Q51 72 73 62" stroke="#B98250" strokeWidth="1.5" fill="none" opacity="0.45" />
        </>
      ));
    case 'prata':
      return wrap(props, (
        <>
          <path d="M20 62 L51 27 L83 61 C65 78 39 79 20 62 Z" fill="url(#fi-dough)" stroke="#3A2D24" strokeWidth="3" />
          <path d="M29 61 Q51 47 73 61 M43 36 Q51 51 59 36" stroke="#8E5A2F" strokeWidth="2" fill="none" opacity="0.55" />
          <path d="M24 62 Q51 72 79 61" stroke="#FFF2D7" strokeWidth="2" fill="none" opacity="0.6" />
        </>
      ));
    case 'crab':
      return wrap(props, (
        <>
          <path d="M24 55 C26 34 43 27 50 36 C57 27 74 34 76 55 C73 73 61 80 50 76 C39 80 27 73 24 55 Z" fill="url(#fi-crab)" stroke="#3A2D24" strokeWidth="3" />
          <path d="M31 46 C42 39 58 39 69 46" stroke="#FFB29C" strokeWidth="3" fill="none" opacity="0.55" />
          <circle cx="41" cy="51" r="3" fill="#3A2D24" />
          <circle cx="59" cy="51" r="3" fill="#3A2D24" />
          <path d="M27 59 C11 56 10 40 24 38 M73 59 C89 56 90 40 76 38" stroke="#3A2D24" strokeWidth="4" fill="none" strokeLinecap="round" />
          <path d="M29 66 L13 77 M39 73 L31 88 M61 73 L69 88 M71 66 L87 77" stroke="#A93521" strokeWidth="5" strokeLinecap="round" />
          <path d="M29 66 L13 77 M39 73 L31 88 M61 73 L69 88 M71 66 L87 77" stroke="#3A2D24" strokeWidth="2" strokeLinecap="round" />
        </>
      ));
    case 'mantou':
      return wrap(props, (
        <>
          <path d="M24 62 C24 43 38 32 50 43 C62 32 76 43 76 62 C74 78 26 78 24 62 Z" fill="#FFF0C2" stroke="#3A2D24" strokeWidth="3" />
          <path d="M31 54 C42 46 58 46 69 54" stroke="#D59B54" strokeWidth="2.4" fill="none" opacity="0.7" />
          <path d="M33 66 Q50 72 67 66" stroke="#FFF7E8" strokeWidth="3" fill="none" opacity="0.7" />
        </>
      ));
    case 'toast':
    case 'kayaToast':
      return wrap(props, (
        <>
          <path d="M23 75 L25 38 C25 20 75 20 75 38 L77 75 Z" fill="url(#fi-bread)" stroke="#3A2D24" strokeWidth="3" />
          <path d="M32 70 L34 40 C34 30 66 30 66 40 L68 70 Z" fill="#FFDFA9" opacity="0.7" />
          {props.kind === 'kayaToast' && (
            <path d="M31 59 C40 49 61 48 70 58 L67 68 C56 63 43 64 33 69 Z" fill="url(#fi-kaya)" stroke="#3A2D24" strokeWidth="1.8" />
          )}
          <path d="M34 36 C42 31 58 31 66 36" stroke="#FFF3D4" strokeWidth="2" fill="none" opacity="0.65" />
        </>
      ));
    case 'egg':
      return wrap(props, (
        <>
          <ellipse cx="50" cy="57" rx="27" ry="34" fill="#FFF7E8" stroke="#3A2D24" strokeWidth="3" />
          <path d="M36 45 C42 35 58 35 64 45" stroke="#FFFFFF" strokeWidth="4" fill="none" opacity="0.8" />
          <path d="M34 68 Q50 79 66 68" stroke="#D8CDB6" strokeWidth="2" fill="none" opacity="0.6" />
        </>
      ));
    case 'crackedEgg':
      return wrap(props, (
        <>
          <path d="M19 63 C26 45 39 42 50 55 C61 42 74 45 81 63 C69 78 31 78 19 63 Z" fill="#FFF7E8" stroke="#3A2D24" strokeWidth="3" />
          <circle cx="50" cy="60" r="13" fill="#E8B83A" stroke="#9D6E10" strokeWidth="2" />
          <path d="M33 54 L43 44 L50 55 L58 44 L67 55" stroke="#3A2D24" strokeWidth="2" fill="none" />
        </>
      ));
    case 'kopiCup':
      return wrap(props, (
        <>
          <path d="M25 43 H74 L68 76 C66 84 34 84 32 76 Z" fill="#FFFFFF" stroke="#3A2D24" strokeWidth="3" />
          <ellipse cx="50" cy="43" rx="27" ry="10" fill="#3A2D24" />
          <ellipse cx="50" cy="41" rx="23" ry="7" fill="#5A3F26" />
          <ellipse cx="50" cy="38" rx="18" ry="4" fill="#FFF4D7" opacity="0.75" />
          <path d="M72 52 C91 50 88 74 69 69" fill="none" stroke="#3A2D24" strokeWidth="5" strokeLinecap="round" />
          <path d="M35 56 h30" stroke="#D8432B" strokeWidth="4" />
        </>
      ));
    case 'cucumber':
      return wrap(props, (
        <>
          <circle cx="50" cy="56" r="27" fill="#558D40" stroke="#3A2D24" strokeWidth="3" />
          <circle cx="50" cy="56" r="20" fill="#E6F4C9" stroke="#7DAA5A" strokeWidth="2" />
          {[0, 1, 2, 3, 4].map((i) => {
            const a = (i / 5) * Math.PI * 2;
            return <ellipse key={i} cx={50 + Math.cos(a) * 8} cy={56 + Math.sin(a) * 8} rx="2" ry="3.4" fill="#9DBC78" />;
          })}
        </>
      ));
    case 'chickenSlice':
      return wrap(props, (
        <>
          <ellipse cx="50" cy="60" rx="36" ry="16" fill="url(#fi-chicken)" stroke="#3A2D24" strokeWidth="3" />
          <path d="M18 51 C33 42 67 42 82 51 L78 58 C62 51 38 51 22 58 Z" fill="#FFE9B0" stroke="#8E5A2F" strokeWidth="1.8" />
          <path d="M31 63 H69" stroke="#9B6B43" strokeWidth="2" fill="none" opacity="0.45" />
        </>
      ));
  }
}

export function StationBackdrop({ variant, className = 'absolute inset-0 w-full h-full pointer-events-none' }: { variant: StationVariant; className?: string }) {
  const accent = {
    prep: '#2BA59D',
    wok: '#D8432B',
    grill: '#E8B83A',
    seafood: '#D8432B',
    kopi: '#6FB552',
  }[variant];

  return (
    <svg viewBox="0 0 360 460" className={className} preserveAspectRatio="xMidYMid slice" aria-hidden>
      <FoodDefs />
      <defs>
        <linearGradient id={`station-bg-${variant}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFE7BD" />
          <stop offset="56%" stopColor="#FFF7E8" />
          <stop offset="100%" stopColor="#E8D4AF" />
        </linearGradient>
      </defs>
      <rect width="360" height="460" fill={`url(#station-bg-${variant})`} />
      <rect y="0" width="360" height="190" fill="url(#fi-tile)" opacity="0.96" />
      <rect y="188" width="360" height="4" fill="#3A2D24" opacity="0.18" />
      <rect y="285" width="360" height="175" fill="url(#fi-counter)" />
      <rect y="285" width="360" height="175" fill="url(#fi-woodgrain)" opacity="0.95" />
      <rect y="285" width="360" height="4" fill="#3A2D24" opacity="0.75" />
      <rect y="292" width="360" height="2" fill="#FFF7E8" opacity="0.34" />
      <path d="M0 240 C58 256 110 244 167 252 C232 261 288 241 360 254 V310 H0 Z" fill={accent} opacity="0.12" />

      {/* Hanging rail and small props. */}
      <path d="M34 52 H326" stroke="#3A2D24" strokeWidth="3" strokeLinecap="round" opacity="0.45" />
      {[74, 122, 238, 286].map((x, i) => (
        <g key={x} opacity="0.5">
          <line x1={x} y1="52" x2={x} y2={74 + (i % 2) * 12} stroke="#3A2D24" strokeWidth="2" />
          <path d={i % 2 === 0 ? `M${x - 9} ${78} q9 10 18 0` : `M${x - 7} ${83} h14 v20 h-14 z`} fill="none" stroke="#3A2D24" strokeWidth="2" />
        </g>
      ))}

      {variant === 'wok' && (
        <g opacity="0.55">
          <ellipse cx="72" cy="320" rx="34" ry="10" fill="#3A2D24" opacity="0.22" />
          <path d="M43 300 q28 -18 58 0 q-7 30 -58 0" fill="url(#fi-wok)" stroke="#3A2D24" strokeWidth="2" />
          <path d="M260 314 q20 -18 43 0" stroke="#3A2D24" strokeWidth="5" fill="none" strokeLinecap="round" />
        </g>
      )}
      {variant === 'seafood' && (
        <g opacity="0.5">
          <rect x="26" y="310" width="76" height="34" rx="8" fill="#CFE8FF" stroke="#3A2D24" strokeWidth="2" />
          <path d="M32 320 h64 M36 334 h54" stroke="#FFFFFF" strokeWidth="3" opacity="0.65" />
          <circle cx="291" cy="317" r="18" fill="#D8432B" stroke="#3A2D24" strokeWidth="2" />
        </g>
      )}
      {variant === 'grill' && (
        <g opacity="0.52">
          <rect x="34" y="307" width="94" height="30" rx="7" fill="#3A2D24" />
          {[45, 61, 77, 93, 109].map((x) => <rect key={x} x={x} y="312" width="8" height="20" rx="3" fill="#D8432B" opacity="0.75" />)}
          <path d="M260 320 q18 -28 36 0" stroke="#3A2D24" strokeWidth="3" fill="none" opacity="0.55" />
        </g>
      )}
      {variant === 'kopi' && (
        <g opacity="0.56">
          <path d="M56 300 h64 l-8 46 h-48 z" fill="#FFFFFF" stroke="#3A2D24" strokeWidth="2" />
          <ellipse cx="88" cy="301" rx="32" ry="8" fill="#5A3F26" />
          <path d="M257 302 q28 24 0 48 q-28 -24 0 -48" fill="#F4EFE6" stroke="#3A2D24" strokeWidth="2" />
        </g>
      )}
      {variant === 'prep' && (
        <g opacity="0.52">
          <rect x="35" y="312" width="90" height="46" rx="10" fill="#D7A66F" stroke="#3A2D24" strokeWidth="2" />
          <path d="M48 334 H112 M66 321 v28" stroke="#8E5A2F" strokeWidth="2" opacity="0.55" />
          <path d="M265 320 h56" stroke="#3A2D24" strokeWidth="6" strokeLinecap="round" />
        </g>
      )}

      {/* Steam and ambient light. */}
      <g opacity="0.23" fill="none" stroke="#3A2D24" strokeWidth="2" strokeLinecap="round">
        <path d="M112 236 q-12 -28 4 -48 q10 -14 -4 -30" />
        <path d="M182 230 q12 -26 -2 -46 q-8 -14 6 -31" />
        <path d="M252 236 q-9 -24 5 -43 q8 -13 -4 -27" />
      </g>
      <circle cx="306" cy="96" r="70" fill="#E8B83A" opacity="0.09" />
    </svg>
  );
}

export function IllustratedPlate({ x = 180, y = 230, rx = 120, ry = 34 }: { x?: number; y?: number; rx?: number; ry?: number }) {
  return (
    <g>
      <ellipse cx={x} cy={y + 20} rx={rx * 1.05} ry={ry * 0.45} fill="rgba(58,45,36,0.18)" />
      <ellipse cx={x} cy={y} rx={rx} ry={ry} fill="#3A2D24" />
      <ellipse cx={x} cy={y - 4} rx={rx - 5} ry={ry - 4} fill="url(#fi-plate)" />
      <ellipse cx={x} cy={y - 3} rx={rx * 0.72} ry={ry * 0.52} fill="rgba(58,45,36,0.08)" />
      <path d={`M${x - rx * 0.55} ${y - ry * 0.62} Q${x} ${y - ry * 1.05} ${x + rx * 0.55} ${y - ry * 0.62}`} stroke="#FFFFFF" strokeWidth="2" fill="none" opacity="0.7" />
    </g>
  );
}

export function IllustratedWok({ x = 180, y = 230, scale = 1 }: { x?: number; y?: number; scale?: number }) {
  return (
    <g transform={`translate(${x}, ${y}) scale(${scale})`}>
      <ellipse cx="0" cy="98" rx="158" ry="17" fill="rgba(58,45,36,0.28)" />
      <path d="M-150 -8 Q-166 72 0 88 Q166 72 150 -8 Z" fill="url(#fi-wok)" stroke="#1B1A1A" strokeWidth="3" />
      <ellipse cx="0" cy="-10" rx="136" ry="72" fill="#1B1A1A" />
      <ellipse cx="0" cy="-12" rx="126" ry="64" fill="url(#fi-wok)" />
      <path d="M-166 -10 q-28 0 -35 12 M166 -10 q28 0 35 12" stroke="#1B1A1A" strokeWidth="10" fill="none" strokeLinecap="round" />
      {[24, 42, 62, 82].map((r) => <ellipse key={r} cx="0" cy="-12" rx={r * 1.45} ry={r * 0.72} fill="none" stroke="rgba(255,190,120,0.09)" strokeWidth="1.4" />)}
    </g>
  );
}
