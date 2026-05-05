import { useEffect, useState, lazy, Suspense } from 'react';
import { useApp } from './state/store';
import { useT } from './i18n/useT';
import { TitleScreen } from './ui/TitleScreen';
import { HawkerMap } from './ui/HawkerMap';
import { Settings } from './ui/Settings';
import { Leaderboard } from './ui/Leaderboard';
import { DishIntro } from './ui/DishIntro';
import { CultureCard } from './ui/CultureCard';
import { DishComplete } from './ui/DishComplete';
import { FirstLaunch } from './ui/FirstLaunch';
import type { DishId, DishResult } from './types';
import { unlockAudio, playMusic } from './audio/audio';
import { track } from './telemetry';

type Screen =
  | { kind: 'title' }
  | { kind: 'map' }
  | { kind: 'settings' }
  | { kind: 'leaderboard' }
  | { kind: 'intro'; dishId: DishId }
  | { kind: 'culture'; dishId: DishId; afterDish?: boolean }
  | { kind: 'dish'; dishId: DishId }
  | { kind: 'complete'; result: DishResult };

const dishLoaders: Record<DishId, () => Promise<{ default: React.ComponentType<{ onComplete: (r: DishResult) => void; onExit: () => void }> }>> = {
  'chicken-rice': () => import('./game/dishes/chicken-rice/ChickenRice'),
  laksa: () => import('./game/dishes/laksa/Laksa'),
  prata: () => import('./game/dishes/prata/Prata'),
  'chili-crab': () => import('./game/dishes/chili-crab/ChiliCrab'),
  'kaya-toast': () => import('./game/dishes/kaya-toast/KayaToast'),
};

function DishPlayer({ dishId, onComplete, onExit }: { dishId: DishId; onComplete: (r: DishResult) => void; onExit: () => void }) {
  const Comp = lazy(dishLoaders[dishId]);
  return (
    <Suspense
      fallback={
        <div className="h-full grid place-items-center text-tile-teal-shade">
          <div className="animate-pulse">…</div>
        </div>
      }
    >
      <Comp onComplete={onComplete} onExit={onExit} />
    </Suspense>
  );
}

export default function App() {
  const firstLaunchSeen = useApp((s) => s.firstLaunchSeen);
  const recordDishResult = useApp((s) => s.recordDishResult);
  const t = useT();
  const [screen, setScreen] = useState<Screen>({ kind: 'title' });

  useEffect(() => {
    // On first user gesture anywhere, unlock audio.
    const onFirst = () => {
      unlockAudio();
      window.removeEventListener('pointerdown', onFirst);
    };
    window.addEventListener('pointerdown', onFirst);
    return () => window.removeEventListener('pointerdown', onFirst);
  }, []);

  // Music pickers per screen.
  useEffect(() => {
    if (screen.kind === 'title') playMusic('title_theme');
    else if (screen.kind === 'map') playMusic('hawker_map_bed');
    else if (screen.kind === 'culture') playMusic('culture_card_calm');
    else if (screen.kind === 'intro') playMusic('tutorial_bed');
    // dish + complete keep whatever is playing or use stings
  }, [screen.kind]);

  const goMap = () => setScreen({ kind: 'map' });

  return (
    <div className="h-full w-full max-w-[480px] mx-auto relative">
      {!firstLaunchSeen && <FirstLaunch onDone={() => setScreen({ kind: 'title' })} />}

      {screen.kind === 'title' && (
        <TitleScreen
          onStart={goMap}
          onSettings={() => setScreen({ kind: 'settings' })}
          onLeaderboard={() => setScreen({ kind: 'leaderboard' })}
        />
      )}

      {screen.kind === 'map' && (
        <HawkerMap
          onPickDish={(id) => {
            track('dish_started', { dish_id: id });
            setScreen({ kind: 'intro', dishId: id });
          }}
          onSettings={() => setScreen({ kind: 'settings' })}
          onLeaderboard={() => setScreen({ kind: 'leaderboard' })}
        />
      )}

      {screen.kind === 'settings' && <Settings onBack={goMap} />}
      {screen.kind === 'leaderboard' && <Leaderboard onBack={goMap} />}

      {screen.kind === 'intro' && (
        <DishIntro
          dishId={screen.dishId}
          onStart={() => setScreen({ kind: 'dish', dishId: screen.dishId })}
          onCulture={() => setScreen({ kind: 'culture', dishId: screen.dishId })}
          onBack={goMap}
        />
      )}

      {screen.kind === 'culture' && (
        <CultureCard
          dishId={screen.dishId}
          onBack={() =>
            screen.afterDish
              ? setScreen({ kind: 'map' })
              : setScreen({ kind: 'intro', dishId: screen.dishId })
          }
        />
      )}

      {screen.kind === 'dish' && (
        <DishPlayer
          dishId={screen.dishId}
          onExit={goMap}
          onComplete={(r) => {
            recordDishResult(r);
            track('dish_completed', { dish_id: r.dishId, total_score: r.totalScore, stars: r.stars });
            setScreen({ kind: 'complete', result: r });
          }}
        />
      )}

      {screen.kind === 'complete' && (
        <DishComplete
          result={screen.result}
          onReadCulture={() =>
            setScreen({ kind: 'culture', dishId: screen.result.dishId, afterDish: true })
          }
          onNext={goMap}
          onReplay={() => setScreen({ kind: 'dish', dishId: screen.result.dishId })}
        />
      )}

      {/* Aria live region for "describe current step" — populated by step components */}
      <div id="aria-live" aria-live="polite" className="sr-only" />

      <div className="absolute bottom-1 left-2 text-[10px] text-outline/50 pointer-events-none select-none">
        {t('app.title')} · v0.1
      </div>
    </div>
  );
}
