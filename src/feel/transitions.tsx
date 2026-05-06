// Screen-transition wrapper. Cross-fades + slides between major screens
// using a key prop. Honors prefers-reduced-motion.

import { useEffect, useState, type ReactNode } from 'react';
import { useApp } from '../state/store';

interface Props {
  screenKey: string;
  children: ReactNode;
}

export function ScreenTransition({ screenKey, children }: Props) {
  const reduced = useApp((s) => s.reducedMotion);
  const [renderKey, setRenderKey] = useState(screenKey);
  const [renderChildren, setRenderChildren] = useState<ReactNode>(children);
  const [phase, setPhase] = useState<'in' | 'out'>('in');

  useEffect(() => {
    if (screenKey === renderKey) {
      setRenderChildren(children);
      return;
    }
    if (reduced) {
      setRenderKey(screenKey);
      setRenderChildren(children);
      return;
    }
    setPhase('out');
    const id = setTimeout(() => {
      setRenderKey(screenKey);
      setRenderChildren(children);
      setPhase('in');
    }, 180);
    return () => clearTimeout(id);
  }, [screenKey, children, renderKey, reduced]);

  if (reduced) return <>{children}</>;

  const styleIn: React.CSSProperties = {
    transition: 'transform 220ms cubic-bezier(0.34, 1.56, 0.64, 1), opacity 220ms ease-out',
    transform: 'translateY(0) scale(1)',
    opacity: 1,
  };
  const styleOut: React.CSSProperties = {
    transition: 'transform 180ms ease-in, opacity 180ms ease-in',
    transform: 'translateY(8px) scale(0.985)',
    opacity: 0,
  };

  return (
    <div style={phase === 'in' ? styleIn : styleOut} className="absolute inset-0">
      {renderChildren}
    </div>
  );
}
