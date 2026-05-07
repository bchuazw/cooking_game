import type { CSSProperties } from 'react';

export function SteamWisps({ className = '', count = 3 }: { className?: string; count?: number }) {
  return (
    <div className={`steam-wisps ${className}`} aria-hidden>
      {Array.from({ length: count }).map((_, i) => (
        <span key={i} style={{ '--i': i } as CSSProperties} />
      ))}
    </div>
  );
}

export function BubbleLayer({ className = '', count = 10 }: { className?: string; count?: number }) {
  return (
    <div className={`bubble-layer ${className}`} aria-hidden>
      {Array.from({ length: count }).map((_, i) => (
        <span key={i} style={{ '--i': i } as CSSProperties} />
      ))}
    </div>
  );
}
