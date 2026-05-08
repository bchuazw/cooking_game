import { useCallback, useEffect, useRef, useState } from 'react';
import { CHICKEN_RICE, starsFromAverage, tierFromScore, type StepDefinition, type Tier } from './gameData';
import { VoxelCanvas, type VisualState } from './VoxelCanvas';

interface StepResult {
  id: string;
  title: string;
  score: number;
  tier: Tier;
}

type Screen = 'menu' | 'cook' | 'result';

const BEST_KEY = 'hawker-mama:fresh-redesign:v1';
const FILLED_STAR = '\u2605';
const EMPTY_STAR = '\u2606';

export default function App() {
  const [screen, setScreen] = useState<Screen>('menu');
  const [stepIndex, setStepIndex] = useState(0);
  const [results, setResults] = useState<StepResult[]>([]);
  const [visualState, setVisualState] = useState<VisualState>({});
  const [feedback, setFeedback] = useState<StepResult | null>(null);
  const [best, setBest] = useState(() => loadBest());
  const completingRef = useRef(false);

  const step = CHICKEN_RICE.steps[stepIndex];
  const average = results.length ? results.reduce((sum, item) => sum + item.score, 0) / results.length : 0;
  const stars = results.length ? starsFromAverage(average) : 1;

  const begin = () => {
    completingRef.current = false;
    setStepIndex(0);
    setResults([]);
    setVisualState({ stepId: CHICKEN_RICE.steps[0].id });
    setFeedback(null);
    setScreen('cook');
  };

  const patchVisual = useCallback((patch: VisualState) => {
    setVisualState((prev) => ({ ...prev, ...patch }));
  }, []);

  const finishStep = useCallback((rawScore: number) => {
    if (completingRef.current) return;
    completingRef.current = true;
    const score = clamp(rawScore, 0.35, 1);
    const result = {
      id: step.id,
      title: step.title,
      score,
      tier: tierFromScore(score),
    };
    setFeedback(result);
    setResults((prev) => [...prev, result]);

    window.setTimeout(() => {
      completingRef.current = false;
      setFeedback(null);
      if (stepIndex + 1 < CHICKEN_RICE.steps.length) {
        const next = CHICKEN_RICE.steps[stepIndex + 1];
        setStepIndex((value) => value + 1);
        setVisualState({ stepId: next.id });
      } else {
        setScreen('result');
      }
    }, 620);
  }, [step, stepIndex]);

  useEffect(() => {
    if (screen !== 'result') return;
    setBest((prev) => {
      const next = Math.max(prev, stars);
      localStorage.setItem(BEST_KEY, String(next));
      return next;
    });
  }, [screen, stars]);

  return (
    <main className="app-shell">
      {screen === 'menu' && <MenuScreen best={best} onBegin={begin} />}
      {screen === 'cook' && (
        <CookScreen
          step={step}
          stepIndex={stepIndex}
          totalSteps={CHICKEN_RICE.steps.length}
          visualState={visualState}
          feedback={feedback}
          onVisual={patchVisual}
          onFinish={finishStep}
          onExit={() => setScreen('menu')}
        />
      )}
      {screen === 'result' && (
        <ResultScreen
          results={results}
          stars={stars}
          onReplay={begin}
          onMenu={() => setScreen('menu')}
        />
      )}
    </main>
  );
}

function MenuScreen({ best, onBegin }: { best: number; onBegin: () => void }) {
  return (
    <section className="screen menu-screen">
      <VoxelCanvas mode="menu" />
      <div className="menu-shade" />
      <header className="menu-card">
        <p className="eyebrow">Singapore cooking game</p>
        <h1>Hawker Mama</h1>
        <p>{CHICKEN_RICE.tagline}</p>
        <div className="best-line" aria-label={`best score ${best} stars`}>
          <span>Best</span>
          <strong>{renderStars(best)}</strong>
        </div>
        <button className="primary-button" data-testid="start-chicken-rice" onClick={onBegin}>
          Cook Chicken Rice
        </button>
      </header>
    </section>
  );
}

function CookScreen({
  step,
  stepIndex,
  totalSteps,
  visualState,
  feedback,
  onVisual,
  onFinish,
  onExit,
}: {
  step: StepDefinition;
  stepIndex: number;
  totalSteps: number;
  visualState: VisualState;
  feedback: StepResult | null;
  onVisual: (patch: VisualState) => void;
  onFinish: (score: number) => void;
  onExit: () => void;
}) {
  return (
    <section className="screen cook-screen">
      <VoxelCanvas mode="cook" stepId={step.id} visualState={visualState} />
      <div className="top-hud">
        <button className="exit-button" onClick={onExit}>Exit</button>
        <div className="step-pips" aria-label={`step ${stepIndex + 1} of ${totalSteps}`}>
          {CHICKEN_RICE.steps.map((item, i) => (
            <span key={item.id} className={i < stepIndex ? 'done' : i === stepIndex ? 'active' : ''}>
              {item.shortTitle}
            </span>
          ))}
        </div>
        <strong>{stepIndex + 1}/{totalSteps}</strong>
      </div>

      <section className="play-panel">
        <div className="step-copy">
          <p className="eyebrow">{CHICKEN_RICE.name}</p>
          <h2>{step.title}</h2>
          <p>{step.instruction}</p>
        </div>
        <MiniGame key={step.id} step={step} onVisual={onVisual} onFinish={onFinish} />
      </section>

      {feedback && (
        <div className={`feedback ${feedback.tier}`} role="status">
          <strong>{feedback.tier}</strong>
          <span>{Math.round(feedback.score * 100)}%</span>
        </div>
      )}
    </section>
  );
}

function MiniGame({
  step,
  onVisual,
  onFinish,
}: {
  step: StepDefinition;
  onVisual: (patch: VisualState) => void;
  onFinish: (score: number) => void;
}) {
  if (step.kind === 'prep') return <PrepGame onVisual={onVisual} onFinish={onFinish} />;
  if (step.kind === 'stir') return <StirGame onVisual={onVisual} onFinish={onFinish} />;
  if (step.kind === 'simmer') return <SimmerGame onVisual={onVisual} onFinish={onFinish} />;
  if (step.kind === 'mash') return <SauceGame onVisual={onVisual} onFinish={onFinish} />;
  return <PlateGame onVisual={onVisual} onFinish={onFinish} />;
}

function PrepGame({ onVisual, onFinish }: { onVisual: (patch: VisualState) => void; onFinish: (score: number) => void }) {
  const ingredients = ['Garlic', 'Ginger', 'Pandan', 'Shallot'];
  const [active, setActive] = useState(0);
  const [cuts, setCuts] = useState(0);
  const [blade, setBlade] = useState(0.5);
  const [cutting, setCutting] = useState(false);
  const bladeRef = useRef(0.5);
  const scoresRef = useRef<number[]>([]);
  const startedAt = useRef(performance.now());
  const roundStarted = useRef(performance.now());

  useEffect(() => {
    onVisual({ prepCuts: cuts, prepActive: active });
  }, [active, cuts, onVisual]);

  useEffect(() => {
    let raf = 0;
    let last = 0;
    const tick = (now: number) => {
      if (!cutting && now - last > 33) {
        last = now;
        const phase = ((now - roundStarted.current) % 1800) / 1800;
        const next = phase < 0.5 ? phase * 2 : 2 - phase * 2;
        bladeRef.current = next;
        setBlade(next);
        onVisual({ prepBlade: next });
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [cutting, onVisual]);

  const chop = () => {
    if (active >= ingredients.length || cutting) return;
    const accuracy = 1 - Math.min(1, Math.abs(bladeRef.current - 0.5) / 0.5);
    const quality = clamp(0.72 + accuracy * 0.28, 0.72, 1);
    scoresRef.current.push(quality);
    const next = active + 1;
    setCutting(true);
    setCuts(next);
    onVisual({ prepCuts: next, prepActive: active, prepBlade: bladeRef.current, prepChop: performance.now(), pulse: performance.now() });

    window.setTimeout(() => {
      if (next >= ingredients.length) {
        const elapsed = performance.now() - startedAt.current;
        const speed = elapsed < 9000 ? 1 : elapsed < 12500 ? 0.92 : 0.82;
        onFinish(avg(scoresRef.current) * speed);
        return;
      }
      setActive(next);
      setCutting(false);
      roundStarted.current = performance.now();
      bladeRef.current = 0.5;
      setBlade(0.5);
      onVisual({ prepCuts: next, prepActive: next, prepBlade: 0.5 });
    }, 520);
  };

  return (
    <div className="mini prep-mini">
      <div className="status-row">
        <span>{Math.min(active + 1, ingredients.length)}/{ingredients.length}</span>
        <strong>{ingredients[active] ?? 'Ready'}</strong>
      </div>
      <div className="chop-timing" data-testid="chop-timing">
        <i className="target-zone" />
        <b style={{ left: `calc(${blade * 100}% - 8px)` }} />
        <span>Line up the blade</span>
      </div>
      <button className="chop-button" data-testid="chop-button" onClick={chop} disabled={cutting}>
        {cutting ? 'Chopped!' : `Chop ${ingredients[active] ?? ''}`}
      </button>
      <ProgressBar value={cuts / ingredients.length} />
    </div>
  );
}

function StirGame({ onVisual, onFinish }: { onVisual: (patch: VisualState) => void; onFinish: (score: number) => void }) {
  const startedAt = useRef(performance.now());
  const roundStarted = useRef(performance.now());
  const markerRef = useRef(0.5);
  const scoresRef = useRef<number[]>([]);
  const tossesRef = useRef(0);
  const targetTosses = 5;
  const [progress, setProgress] = useState(0);
  const progressRef = useRef(0);
  const [marker, setMarker] = useState(0.5);
  const [tossing, setTossing] = useState(false);
  const [tosses, setTosses] = useState(0);
  const [cue, setCue] = useState('Rice in wok');
  const done = useRef(false);

  useEffect(() => {
    let raf = 0;
    let last = 0;
    const tick = (now: number) => {
      if (!tossing && !done.current && now - last > 33) {
        last = now;
        const phase = ((now - roundStarted.current) % 1700) / 1700;
        const next = phase < 0.5 ? phase * 2 : 2 - phase * 2;
        markerRef.current = next;
        setMarker(next);
        onVisual({ stirMarker: next, stirProgress: progressRef.current });
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [onVisual, tossing]);

  const toss = () => {
    if (done.current || tossing) return;
    const accuracy = 1 - Math.min(1, Math.abs(markerRef.current - 0.5) / 0.5);
    const quality = clamp(0.72 + accuracy * 0.28, 0.72, 1);
    scoresRef.current.push(quality);
    tossesRef.current += 1;
    setTosses(tossesRef.current);
    setCue(accuracy > 0.86 ? 'Perfect toss' : accuracy > 0.64 ? 'Good toss' : 'Rice tossed');
    const nextProgress = clamp(progressRef.current + 0.17 + quality * 0.06, 0, 1);
    progressRef.current = nextProgress;
    setProgress(nextProgress);
    setTossing(true);
    onVisual({
      stirProgress: nextProgress,
      stirMarker: markerRef.current,
      stirTurns: tossesRef.current,
      stirToss: performance.now(),
      pulse: performance.now(),
    });

    window.setTimeout(() => {
      if (nextProgress >= 1) {
        done.current = true;
        const elapsed = performance.now() - startedAt.current;
        onFinish(avg(scoresRef.current) * (elapsed < 9000 ? 1 : elapsed < 12500 ? 0.92 : 0.82));
        return;
      }
      setTossing(false);
      roundStarted.current = performance.now();
      markerRef.current = 0.5;
      setMarker(0.5);
      setCue('Rice in wok');
      onVisual({ stirProgress: nextProgress, stirMarker: 0.5 });
    }, 430);
  };

  return (
    <div className="mini">
      <div className="status-row">
        <span>{tossing ? cue : 'Toast the rice'}</span>
        <strong>{Math.min(tosses, targetTosses)}/{targetTosses}</strong>
      </div>
      <div className="timing-caption">{tossing ? 'The rice jumps and turns in the wok.' : 'Tap when the black marker crosses the gold zone.'}</div>
      <div className="chop-timing toss-timing" data-testid="toss-timing">
        <i className="target-zone" />
        <b style={{ left: `calc(${marker * 100}% - 8px)` }} />
      </div>
      <button className="chop-button toss-button" data-testid="toss-button" onClick={toss} disabled={tossing}>
        {tossing ? 'Rice tossed!' : 'Toss the Rice'}
      </button>
      <ProgressBar value={progress} />
    </div>
  );
}

function SimmerGame({ onVisual, onFinish }: { onVisual: (patch: VisualState) => void; onFinish: (score: number) => void }) {
  const railRef = useRef<HTMLDivElement>(null);
  const [heat, setHeat] = useState(0.22);
  const [hold, setHold] = useState(0);
  const [hits, setHits] = useState(0);
  const done = useRef(false);
  const startedAt = useRef(performance.now());
  const heatRef = useRef(0.22);
  const hitsRef = useRef(0);

  const inZone = heat >= 0.55 && heat <= 0.72;
  const progress = clamp((hold / 1600) * 0.72 + (hits / 3) * 0.28, 0, 1);

  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = now - last;
      last = now;
      const liveInZone = heatRef.current >= 0.55 && heatRef.current <= 0.72;
      setHold((value) => liveInZone ? value + dt : Math.max(0, value - dt * 0.8));
      onVisual({ simmerHeat: heatRef.current, simmerHits: hitsRef.current, simmerReady: liveInZone });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [onVisual]);

  useEffect(() => {
    if (!done.current && hold >= 1600 && hits >= 3) {
      done.current = true;
      const elapsed = performance.now() - startedAt.current;
      onFinish(elapsed < 8000 ? 1 : elapsed < 11500 ? 0.86 : 0.72);
    }
  }, [hits, hold, onFinish]);

  const updateHeat = (clientY: number) => {
    const rect = railRef.current?.getBoundingClientRect();
    if (!rect) return;
    const next = 1 - clamp((clientY - rect.top) / rect.height, 0, 1);
    heatRef.current = next;
    setHeat(next);
    onVisual({ simmerHeat: next, simmerReady: next >= 0.55 && next <= 0.72 });
  };

  return (
    <div className="mini simmer-mini">
      <div
        ref={railRef}
        className="heat-rail"
        data-testid="simmer-slider"
        onPointerDown={(event) => {
          event.preventDefault();
          event.currentTarget.setPointerCapture(event.pointerId);
          updateHeat(event.clientY);
        }}
        onPointerMove={(event) => {
          event.preventDefault();
          if (event.buttons || event.pointerType === 'touch') updateHeat(event.clientY);
        }}
      >
        <i className="simmer-zone">simmer</i>
        <b style={{ bottom: `calc(${heat * 100}% - 18px)` }}>drag</b>
      </div>
      <button
        className={`bubble-button ${inZone ? 'ready' : ''}`}
        data-testid="bubble-button"
        onClick={() => {
          if (!inZone) return;
          const next = Math.min(3, hitsRef.current + 1);
          hitsRef.current = next;
          setHits(next);
          onVisual({ simmerHits: next, pulse: performance.now() });
        }}
      >
        <span>{inZone ? 'Tap bubbles' : 'Find simmer zone'}</span>
        <strong>{hits}/3</strong>
      </button>
      <ProgressBar value={progress} />
    </div>
  );
}

function SauceGame({ onVisual, onFinish }: { onVisual: (patch: VisualState) => void; onFinish: (score: number) => void }) {
  const items = [
    ['chili', 'Chili'],
    ['ginger', 'Ginger'],
    ['garlic', 'Garlic'],
    ['lime', 'Lime'],
  ] as const;
  const [added, setAdded] = useState<string[]>([]);
  const [mashes, setMashes] = useState(0);
  const startedAt = useRef(performance.now());
  const done = useRef(false);

  const add = (id: string) => {
    setAdded((prev) => {
      if (prev.includes(id)) return prev;
      const next = [...prev, id];
      onVisual({ sauceItems: next, pulse: performance.now() });
      return next;
    });
  };

  const mash = () => {
    if (added.length < items.length || done.current) return;
    const next = mashes + 1;
    setMashes(next);
    onVisual({ mashCount: next, sauceItems: added, pulse: performance.now() });
    if (next >= 4) {
      done.current = true;
      const elapsed = performance.now() - startedAt.current;
      window.setTimeout(() => onFinish(elapsed < 9000 ? 1 : elapsed < 13000 ? 0.86 : 0.72), 260);
    }
  };

  return (
    <div className="mini sauce-mini">
      <div className="token-grid">
        {items.map(([id, label]) => (
          <button
            key={id}
            className={added.includes(id) ? 'done' : ''}
            data-testid={`sauce-token-${id}`}
            onClick={() => add(id)}
          >
            {label}
          </button>
        ))}
      </div>
      <button className="mortar-pad" data-testid="mortar-pad" onClick={mash}>
        <span>{added.length < items.length ? 'Add all sauce ingredients' : 'Tap to mash sauce'}</span>
        <strong>{mashes}/4</strong>
      </button>
      <ProgressBar value={(added.length / items.length) * 0.55 + (mashes / 4) * 0.45} />
    </div>
  );
}

function PlateGame({ onVisual, onFinish }: { onVisual: (patch: VisualState) => void; onFinish: (score: number) => void }) {
  const items = [
    ['rice', 'Rice'],
    ['chicken', 'Chicken'],
    ['cucumber', 'Cucumber'],
    ['chili', 'Chili'],
  ] as const;
  const [placed, setPlaced] = useState<string[]>([]);
  const startedAt = useRef(performance.now());
  const done = useRef(false);

  const place = (id: string) => {
    if (done.current) return;
    setPlaced((prev) => {
      if (prev.includes(id)) return prev;
      const next = [...prev, id];
      onVisual({ plateItems: next, pulse: performance.now() });
      if (next.length >= items.length) {
        done.current = true;
        const elapsed = performance.now() - startedAt.current;
        window.setTimeout(() => onFinish(elapsed < 8500 ? 1 : elapsed < 12000 ? 0.86 : 0.74), 360);
      }
      return next;
    });
  };

  return (
    <div className="mini plate-mini">
      <div className="plate-drop" data-testid="plate-drop">
        {placed.length}/4 on plate
      </div>
      <div className="token-grid">
        {items.map(([id, label]) => (
          <button
            key={id}
            className={placed.includes(id) ? 'done' : ''}
            data-testid={`plate-token-${id}`}
            onClick={() => place(id)}
          >
            {label}
          </button>
        ))}
      </div>
      <ProgressBar value={placed.length / items.length} />
    </div>
  );
}

function ResultScreen({
  results,
  stars,
  onReplay,
  onMenu,
}: {
  results: StepResult[];
  stars: 1 | 2 | 3;
  onReplay: () => void;
  onMenu: () => void;
}) {
  return (
    <section className="screen result-screen">
      <VoxelCanvas mode="result" />
      <div className="result-card">
        <p className="eyebrow">Dish complete</p>
        <h1>{CHICKEN_RICE.name}</h1>
        <div className="result-stars" data-testid="result-stars">{renderStars(stars)}</div>
        <div className="result-list">
          {results.map((item) => (
            <div key={item.id}>
              <span>{item.title}</span>
              <strong>{item.tier}</strong>
            </div>
          ))}
        </div>
        <section className="learning-card">
          <h2>What you learned</h2>
          <p>{CHICKEN_RICE.learning}</p>
        </section>
        <div className="result-actions">
          <button className="primary-button" onClick={onReplay}>Cook again</button>
          <button className="secondary-button" onClick={onMenu}>Menu</button>
        </div>
      </div>
    </section>
  );
}

function ProgressBar({ value }: { value: number }) {
  return <div className="progress-bar"><i style={{ width: `${clamp(value, 0, 1) * 100}%` }} /></div>;
}

function loadBest() {
  const value = Number(localStorage.getItem(BEST_KEY) ?? 0);
  return Number.isFinite(value) ? clamp(Math.round(value), 0, 3) : 0;
}

function avg(values: number[]) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0.7;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function renderStars(value: number) {
  return FILLED_STAR.repeat(value) + EMPTY_STAR.repeat(3 - value);
}
