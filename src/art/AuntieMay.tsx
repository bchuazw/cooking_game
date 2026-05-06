// Procedural Auntie May. Brief §6 calls for a Rive .riv with a state machine and
// the same input names; ours is a TS state machine with SVG. Same surface so a
// future .riv is a one-component swap.

import { useEffect, useRef } from 'react';
import type { AuntieMood } from '../types';
import { useApp } from '../state/store';

export interface AuntieMayProps {
  mood: AuntieMood;
  enthusiasm?: number; // 0..100, brightness of animation
  size?: number; // px, square
  className?: string;
  // Numeric mood: -100..100 (warm/worried). Drives eyebrow tilt subtly.
  moodValue?: number;
}

// Eyebrow expressions are 60% of the work (brief §7).
function expressionFor(mood: AuntieMood): {
  brow: 'flat' | 'down' | 'up' | 'arch';
  mouth: 'smile' | 'open' | 'flat' | 'oh' | 'grin';
  eyes: 'open' | 'closed' | 'squint' | 'wide';
  cheeks: 'rest' | 'lift';
  lean: number; // -8..8 px
  hands: 'down' | 'up' | 'fan' | 'point' | 'ladle';
} {
  switch (mood) {
    case 'cheering':
      return { brow: 'arch', mouth: 'grin', eyes: 'wide', cheeks: 'lift', lean: 0, hands: 'up' };
    case 'dish_perfect':
      return { brow: 'arch', mouth: 'grin', eyes: 'wide', cheeks: 'lift', lean: 2, hands: 'up' };
    case 'worried':
      return { brow: 'down', mouth: 'flat', eyes: 'squint', cheeks: 'rest', lean: -2, hands: 'ladle' };
    case 'tasting':
      return { brow: 'flat', mouth: 'oh', eyes: 'closed', cheeks: 'lift', lean: 0, hands: 'down' };
    case 'dish_burned':
      return { brow: 'up', mouth: 'oh', eyes: 'wide', cheeks: 'rest', lean: -3, hands: 'fan' };
    case 'culture_card':
      return { brow: 'up', mouth: 'smile', eyes: 'open', cheeks: 'rest', lean: 6, hands: 'point' };
    case 'tutorial_pointing':
      return { brow: 'up', mouth: 'smile', eyes: 'open', cheeks: 'rest', lean: 0, hands: 'point' };
    case 'idle':
    default:
      return { brow: 'flat', mouth: 'smile', eyes: 'open', cheeks: 'rest', lean: 0, hands: 'down' };
  }
}

export function AuntieMay({ mood, size = 220, className = '', moodValue = 0 }: AuntieMayProps) {
  const reduced = useApp((s) => s.reducedMotion);
  const ref = useRef<SVGSVGElement>(null);
  const exp = expressionFor(mood);

  // simple breath / blink loop
  useEffect(() => {
    if (reduced) return;
    let raf = 0;
    let t0 = performance.now();
    const loop = (now: number) => {
      const t = (now - t0) / 1000;
      if (ref.current) {
        const breathe = Math.sin(t * 1.8) * 1.5;
        ref.current.style.setProperty('--breath', `${breathe}px`);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [reduced]);

  // Brow tilt comes from the numeric mood value too (brief §6 inputs).
  const browTilt = Math.max(-6, Math.min(6, -moodValue / 20));

  return (
    <svg
      ref={ref}
      viewBox="0 0 220 240"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label="Auntie May"
      style={{ overflow: 'visible' }}
    >
      <defs>
        {/* skin radial — warm with subtle shadow */}
        <radialGradient id="am-skin" cx="0.5" cy="0.4" r="0.7">
          <stop offset="0%" stopColor="#FFE5C8" />
          <stop offset="60%" stopColor="#F1C9A4" />
          <stop offset="100%" stopColor="#C99977" />
        </radialGradient>
        <linearGradient id="am-polo" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7EBF5F" />
          <stop offset="60%" stopColor="#6FB552" />
          <stop offset="100%" stopColor="#4A8635" />
        </linearGradient>
        <linearGradient id="am-apron" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFFAF1" />
          <stop offset="100%" stopColor="#E0D6C0" />
        </linearGradient>
        <linearGradient id="am-hair" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6F5A50" />
          <stop offset="100%" stopColor="#3D2E26" />
        </linearGradient>
        <radialGradient id="am-cheek" cx="0.5" cy="0.5" r="0.6">
          <stop offset="0%" stopColor="rgba(232,155,139,0.9)" />
          <stop offset="100%" stopColor="rgba(232,155,139,0)" />
        </radialGradient>
        <pattern id="am-batik" x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
          <rect width="10" height="10" fill="#2BA59D" />
          <path d="M 5 0 L 7 3 L 5 6 L 3 3 Z" fill="#FFD9A0" opacity="0.7" />
        </pattern>
      </defs>
      <g style={{ transform: `translate(0, var(--breath, 0px)) translateX(${exp.lean}px)` }}>
        {/* Polo body */}
        <path
          d="M30 220 C30 170, 60 150, 110 150 C160 150, 190 170, 190 220 Z"
          fill="url(#am-polo)"
          stroke="#3A2D24"
          strokeWidth="3"
        />
        {/* sleeve fold */}
        <path d="M40 200 q 8 8 18 6" stroke="rgba(58,45,36,0.35)" strokeWidth="1.5" fill="none" />
        <path d="M180 200 q -8 8 -18 6" stroke="rgba(58,45,36,0.35)" strokeWidth="1.5" fill="none" />
        {/* Apron */}
        <path
          d="M70 160 L150 160 L160 220 L60 220 Z"
          fill="url(#am-apron)"
          stroke="#3A2D24"
          strokeWidth="3"
        />
        {/* apron stitching */}
        <path d="M75 165 L145 165" stroke="rgba(58,45,36,0.3)" strokeDasharray="2 3" strokeWidth="0.8" fill="none" />
        <path d="M65 215 L155 215" stroke="rgba(58,45,36,0.3)" strokeDasharray="2 3" strokeWidth="0.8" fill="none" />
        {/* apron pocket */}
        <path d="M115 178 L145 178 L143 198 L117 198 Z" fill="rgba(58,45,36,0.05)" stroke="rgba(58,45,36,0.4)" strokeWidth="1" />
        {/* Sambal red apron piping */}
        <path d="M70 160 L150 160 M60 220 L160 220" stroke="#D8432B" strokeWidth="3" fill="none" />
        {/* Ladle clipped to apron pocket */}
        <g transform="translate(124, 178) rotate(15)">
          <rect x="0" y="0" width="3" height="32" fill="#5A3F26" />
          <rect x="0" y="0" width="1.2" height="32" fill="#7E5C3D" />
          <ellipse cx="1.5" cy="36" rx="7" ry="4.5" fill="#3A2D24" />
          <ellipse cx="1.5" cy="35" rx="5.5" ry="3" fill="#5A3F26" />
        </g>
        {/* Batik trim collar */}
        <path
          d="M85 152 Q110 144 135 152 L130 162 Q110 156 90 162 Z"
          fill="url(#am-batik)"
          stroke="#3A2D24"
          strokeWidth="2"
        />
        {/* Hands */}
        {exp.hands === 'up' && (
          <>
            <circle cx="40" cy="158" r="14" fill="url(#am-skin)" stroke="#7B5A3D" strokeWidth="2.5" />
            <circle cx="180" cy="158" r="14" fill="url(#am-skin)" stroke="#7B5A3D" strokeWidth="2.5" />
          </>
        )}
        {exp.hands === 'fan' && (
          <g>
            <circle cx="60" cy="180" r="12" fill="url(#am-skin)" stroke="#7B5A3D" strokeWidth="2.5" />
            <circle cx="160" cy="170" r="12" fill="url(#am-skin)" stroke="#7B5A3D" strokeWidth="2.5" />
            <path d="M150 165 Q145 145 165 140" stroke="#999" strokeWidth="2" fill="none" />
            <path d="M155 162 Q160 142 175 142" stroke="#999" strokeWidth="2" fill="none" />
          </g>
        )}
        {exp.hands === 'point' && (
          <>
            <circle cx="50" cy="195" r="12" fill="url(#am-skin)" stroke="#7B5A3D" strokeWidth="2.5" />
            <circle cx="180" cy="180" r="12" fill="url(#am-skin)" stroke="#7B5A3D" strokeWidth="2.5" />
            <rect x="190" y="178" width="14" height="4" fill="#F1C9A4" stroke="#3A2D24" strokeWidth="2" />
          </>
        )}
        {(exp.hands === 'down' || exp.hands === 'ladle') && (
          <>
            <circle cx="55" cy="200" r="12" fill="url(#am-skin)" stroke="#7B5A3D" strokeWidth="2.5" />
            <circle cx="165" cy="200" r="12" fill="url(#am-skin)" stroke="#7B5A3D" strokeWidth="2.5" />
          </>
        )}

        {/* Neck */}
        <rect x="100" y="135" width="20" height="20" fill="url(#am-skin)" stroke="#7B5A3D" strokeWidth="2.5" />
        {/* neck shadow */}
        <path d="M100 135 Q110 142 120 135" stroke="rgba(58,45,36,0.35)" strokeWidth="1.5" fill="rgba(58,45,36,0.1)" />
        {/* Head */}
        <ellipse cx="110" cy="100" rx="56" ry="50" fill="url(#am-skin)" stroke="#7B5A3D" strokeWidth="2.5" />
        {/* face left-side shadow */}
        <ellipse cx="76" cy="110" rx="20" ry="34" fill="rgba(58,45,36,0.06)" />
        {/* cheek blush */}
        <ellipse cx="76" cy="118" rx="10" ry="6" fill="url(#am-cheek)" />
        <ellipse cx="146" cy="118" rx="10" ry="6" fill="url(#am-cheek)" />
        {/* Hair (salt and pepper bun) */}
        <path
          d="M55 90 Q50 50 110 45 Q170 50 165 90 Q160 65 110 60 Q60 65 55 90 Z"
          fill="url(#am-hair)"
          stroke="#3A2D24"
          strokeWidth="2.5"
        />
        {/* hair strand highlights */}
        <path d="M62 80 Q70 60 90 56" stroke="#8C7567" strokeWidth="1.2" fill="none" opacity="0.8" />
        <path d="M150 78 Q145 60 130 56" stroke="#8C7567" strokeWidth="1.2" fill="none" opacity="0.8" />
        {/* Bun */}
        <ellipse cx="110" cy="46" rx="22" ry="14" fill="url(#am-hair)" stroke="#3A2D24" strokeWidth="2.5" />
        <path d="M95 44 Q110 38 125 44" stroke="#8C7567" strokeWidth="1" fill="none" opacity="0.8" />
        {/* Salt streaks */}
        <path d="M70 75 Q90 70 92 80" stroke="#D9D2CC" strokeWidth="2" fill="none" />
        <path d="M135 70 Q145 75 150 82" stroke="#D9D2CC" strokeWidth="2" fill="none" />
        <path d="M105 50 q 8 -1 14 0" stroke="#D9D2CC" strokeWidth="1.2" fill="none" opacity="0.6" />
        {/* Jade pin */}
        <circle cx="110" cy="46" r="3" fill={mood === 'dish_perfect' ? '#A8E6A0' : '#6FB552'} stroke="#3A2D24" strokeWidth="1.5" />
        {/* Glasses */}
        <g stroke="#3A2D24" strokeWidth="2.5" fill="none">
          <circle cx="86" cy="100" r="14" />
          <circle cx="134" cy="100" r="14" />
          <line x1="100" y1="100" x2="120" y2="100" />
        </g>
        {/* Eyes */}
        <g style={{ transform: `translateY(0)` }}>
          {exp.eyes === 'closed' ? (
            <>
              <path d="M78 100 Q86 105 94 100" stroke="#3A2D24" strokeWidth="2.5" fill="none" />
              <path d="M126 100 Q134 105 142 100" stroke="#3A2D24" strokeWidth="2.5" fill="none" />
            </>
          ) : exp.eyes === 'squint' ? (
            <>
              <path d="M80 100 Q86 102 92 100" stroke="#3A2D24" strokeWidth="3" fill="none" />
              <path d="M128 100 Q134 102 140 100" stroke="#3A2D24" strokeWidth="3" fill="none" />
            </>
          ) : exp.eyes === 'wide' ? (
            <>
              <circle cx="86" cy="100" r="4" fill="#3A2D24" />
              <circle cx="134" cy="100" r="4" fill="#3A2D24" />
              <circle cx="87" cy="99" r="1.2" fill="#fff" />
              <circle cx="135" cy="99" r="1.2" fill="#fff" />
            </>
          ) : (
            <>
              <circle cx="86" cy="100" r="3" fill="#3A2D24" />
              <circle cx="134" cy="100" r="3" fill="#3A2D24" />
            </>
          )}
        </g>
        {/* Brows — 60% of the emotional work */}
        <g style={{ transform: `rotate(${browTilt}deg)`, transformOrigin: '110px 80px' }}>
          {exp.brow === 'flat' && (
            <>
              <rect x="74" y="78" width="22" height="3" rx="1.5" fill="#3A2D24" />
              <rect x="124" y="78" width="22" height="3" rx="1.5" fill="#3A2D24" />
            </>
          )}
          {exp.brow === 'up' && (
            <>
              <path d="M74 80 Q86 70 96 78" stroke="#3A2D24" strokeWidth="3" fill="none" strokeLinecap="round" />
              <path d="M124 78 Q134 70 146 80" stroke="#3A2D24" strokeWidth="3" fill="none" strokeLinecap="round" />
            </>
          )}
          {exp.brow === 'down' && (
            <>
              <path d="M74 76 Q86 84 96 80" stroke="#3A2D24" strokeWidth="3" fill="none" strokeLinecap="round" />
              <path d="M124 80 Q134 84 146 76" stroke="#3A2D24" strokeWidth="3" fill="none" strokeLinecap="round" />
            </>
          )}
          {exp.brow === 'arch' && (
            <>
              <path d="M72 82 Q86 64 98 80" stroke="#3A2D24" strokeWidth="3" fill="none" strokeLinecap="round" />
              <path d="M122 80 Q134 64 148 82" stroke="#3A2D24" strokeWidth="3" fill="none" strokeLinecap="round" />
            </>
          )}
        </g>
        {/* Cheeks */}
        {exp.cheeks === 'lift' && (
          <>
            <ellipse cx="74" cy="118" rx="8" ry="5" fill="#E89B8B" opacity="0.6" />
            <ellipse cx="146" cy="118" rx="8" ry="5" fill="#E89B8B" opacity="0.6" />
          </>
        )}
        {/* Mouth */}
        {exp.mouth === 'smile' && (
          <path d="M96 128 Q110 138 124 128" stroke="#3A2D24" strokeWidth="3" fill="none" strokeLinecap="round" />
        )}
        {exp.mouth === 'grin' && (
          <path
            d="M88 128 Q110 148 132 128 Q110 142 88 128 Z"
            fill="#A93521"
            stroke="#3A2D24"
            strokeWidth="2.5"
          />
        )}
        {exp.mouth === 'flat' && (
          <line x1="100" y1="130" x2="120" y2="130" stroke="#3A2D24" strokeWidth="3" strokeLinecap="round" />
        )}
        {exp.mouth === 'oh' && (
          <ellipse cx="110" cy="130" rx="6" ry="8" fill="#A93521" stroke="#3A2D24" strokeWidth="2.5" />
        )}
        {exp.mouth === 'open' && (
          <ellipse cx="110" cy="132" rx="10" ry="6" fill="#A93521" stroke="#3A2D24" strokeWidth="2.5" />
        )}
      </g>
    </svg>
  );
}
