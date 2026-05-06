// Combo HUD — shows the current streak with a pop animation.

import { useEffect, useState } from 'react';
import { useApp } from '../../state/store';

interface Props {
  combo: number;
}

export function ComboBadge({ combo }: Props) {
  const reduced = useApp((s) => s.reducedMotion);
  const [pulse, setPulse] = useState(false);
  useEffect(() => {
    if (combo < 2) return;
    setPulse(true);
    const id = setTimeout(() => setPulse(false), 220);
    return () => clearTimeout(id);
  }, [combo]);

  if (combo < 2) return null;
  return (
    <div
      className="absolute top-3 left-1/2 -translate-x-1/2 z-20 pointer-events-none"
      style={{ transition: reduced ? undefined : 'transform 200ms cubic-bezier(0.34,1.56,0.64,1)', transform: pulse ? 'scale(1.2)' : 'scale(1)' }}
    >
      <div className="bg-sambal text-white px-3 py-1 rounded-chip border-2 border-outline shadow-soft text-sm font-display font-bold">
        {combo}× COMBO
      </div>
    </div>
  );
}
